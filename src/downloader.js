import JSZip from 'jszip';
import FileSaver from 'file-saver';
import fetcher from './fetcher';
import {getExtension, getExtensionFromUrl, getAssetFileName, getIndexedFileName, numeriseFileName, queue} from './util';


const saveFile = params => FileSaver.saveAs(params.content, params.downloadFileName);

const saveAsZip = (assetData, downloadFileName, queuedSaveFile, cb) => {
  const zip = new JSZip();
  const folder = zip.folder(downloadFileName);

  for (let i = 0; i < assetData.length; i++) {
    folder.file(assetData[i].asset.name, assetData[i].result, { base64: false });
  }

  zip.generateAsync({ type: "blob" })
    .then(content => {
      queuedSaveFile({
        content: content,
        downloadFileName: `${downloadFileName}.zip`,
      });
      cb && cb();
    });
};

const downloadAssets = (assets, {downloadFileName, maxZIPSize, statusCallback, onComplete}) => {
  const assetCount = assets.length;
  const failedAssetList = [];
  const queuedSaveFile = queue(saveFile, 1000); //function calls queued to execute once in 1 sec because of lib issue.
  let assetsToSave = [];
  let numberOfDownloadedAssets = 0;
  let downloadedZIPFileCount = 0;
  let numberOfFailedAssets = 0;
  let numberOfLargeUnZippedAssets = 0;
  let downloadedAssetSize = 0;

  const resolvePromise = () => onComplete({
    numberOfDownloadedAssets,
    numberOfFailedAssets,
    numberOfLargeUnZippedAssets,
    failedAssetList,
    numberOfDownloadedZIPFiles: downloadedZIPFileCount > 0 ? ++downloadedZIPFileCount : downloadedZIPFileCount,
  });

  const testAndSave = savedAsset => {
    if (savedAsset) { //download success
      const assetSize = savedAsset.result.byteLength;
      if (downloadedAssetSize + assetSize > maxZIPSize) {
        saveAsZip(assetsToSave, getIndexedFileName(downloadFileName, downloadedZIPFileCount), queuedSaveFile);
        downloadedZIPFileCount++;
        assetsToSave = [savedAsset];
        downloadedAssetSize = assetSize;
      } else {
        assetsToSave.push(savedAsset);
        downloadedAssetSize = downloadedAssetSize + assetSize;
      }
    }

    if ((numberOfDownloadedAssets + numberOfFailedAssets) === assetCount) {//check for asset download completion
      if (assetsToSave.length) {
        saveAsZip(assetsToSave, getIndexedFileName(downloadFileName, downloadedZIPFileCount), queuedSaveFile, resolvePromise);
      } else {
        resolvePromise();
      }
    }
  };

  const onSuccess = (asset, result) => {
    let savedAssetInfo;
    statusCallback(++numberOfDownloadedAssets);

    if (result.byteLength > maxZIPSize) { //downloading separately because of 2gb limit
      ++numberOfLargeUnZippedAssets;
      queuedSaveFile({
        content: new Blob([result]),
        downloadFileName: asset.name
      });
    } else {
      savedAssetInfo = { result: result, asset: asset };
    }

    testAndSave(savedAssetInfo);
  };

  const onFailure = asset => {
    failedAssetList.push(asset);
    ++numberOfFailedAssets;
    testAndSave();
  };

  assets.forEach(asset => fetcher(asset.src, onSuccess.bind(null, asset), onFailure.bind(null, asset)));
};

const DEFAULT_OPTIONS = {
  downloadFileName: 'zipped_files',
  maxZIPSize: 2000000000, //jszip limit
  downloadBigFiles: true,
  statusCallback: ()=> {
  },
  onComplete: ()=> {
  },
};

const parseOptions = options => {
  let maxZIPSize = DEFAULT_OPTIONS.maxZIPSize;
  if (options.maxZIPSize && options.maxZIPSize < DEFAULT_OPTIONS.maxZIPSize) {
    maxZIPSize = options.maxZIPSize;
  }

  return Object.assign({}, DEFAULT_OPTIONS, options, { maxZIPSize });
};

const parseAssets = assets => {
  const fileNameCounts = {};

  return assets.reduce((acc, {src, name})=> {
    let assetName = name;
    if (src) {
      assetName = getAssetFileName(name, src);

      const uniqueFileName = assetName.toLowerCase();
      let fileNameCount = fileNameCounts[uniqueFileName] || 0;
      if (fileNameCount) {
        assetName = numeriseFileName(assetName, fileNameCount);
      }
      fileNameCounts[uniqueFileName] = ++fileNameCount;

      acc.push({
        src,
        name: assetName
      })
    }

    return acc;
  }, []);
};

export default (assets = [], options) => {
  const opts = parseOptions(options);
  downloadAssets(parseAssets(assets), opts);
};