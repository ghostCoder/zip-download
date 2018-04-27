import JSZip from 'jszip';
import FileSaver from 'file-saver';

import {getExtension, getExtensionFromUrl, getAssetFileName, getIndexedFileName, numeriseFileName} from './util';
import fetcher from './fetcher';


const getSaveFilesFn = function () { //function calls queued to execute once in 1 sec because of lib issue.
  var callQueue = [];
  var isPaused;
  var callSaveAs = function (content, downloadFileName) {
    isPaused = true;
    FileSaver.saveAs(content, downloadFileName);
    setTimeout(play, 1000);
  };

  var play = function () {
    isPaused = false;
    if (callQueue.length) {
      var params = callQueue.shift();
      callSaveAs(params.content, params.downloadFileName);
    }
  };

  return function (params) {
    if (isPaused) {
      callQueue.push(params);
    } else {
      callSaveAs(params.content, params.downloadFileName);
    }
  }
};

const saveAsZip = function (assetData, downloadFileName, saveFiles, cb) {
  var zip = new JSZip();
  var folder = zip.folder(downloadFileName);

  for (var i = 0; i < assetData.length; i++) {
    folder.file(assetData[i].asset.name, assetData[i].result, { base64: false });
  }

  zip.generateAsync({ type: "blob" })
    .then(function (content) {
      saveFiles({
        content: content,
        downloadFileName: downloadFileName + '.zip'
      });
      cb && cb();
    });
};

const downloadAssets = function (assets, {downloadFileName, maxZIPSize, statusCallback, onComplete}) {

    var assetCount = assets.length;
    var downloadedAssetCount = 0;
    var downloadedZIPFileCount = 0;
    var failedAssetCount = 0;
    var largeFileCount = 0;
    var downloadedAssetSize = 0;
    var failedAssetList = [];
    var assetsToSave = [];
    var saveFiles = getSaveFilesFn();
    var resolvePromise = function () {
      onComplete({
        numberOfDownloadedAssets: downloadedAssetCount,
        numberOfFailedAssets: failedAssetCount,
        numberOfLargeUnZippedAssets: largeFileCount,
        numberOfDownloadedZIPFiles: downloadedZIPFileCount > 0 ? ++downloadedZIPFileCount : downloadedZIPFileCount,
        failedAssetList: failedAssetList,
      });
    };

    var testAndSave = function (savedAsset) {
      if (savedAsset) { //download success
        const assetSize = savedAsset.result.byteLength;
        if (downloadedAssetSize + assetSize > maxZIPSize) {
          saveAsZip(assetsToSave, getIndexedFileName(downloadFileName, downloadedZIPFileCount), saveFiles);
          downloadedZIPFileCount++;
          assetsToSave = [savedAsset];
          downloadedAssetSize = assetSize;
        } else {
          assetsToSave.push(savedAsset);
          downloadedAssetSize = downloadedAssetSize + assetSize;
        }
      }

      if ((downloadedAssetCount + failedAssetCount) === assetCount) {//check for asset download completion
        if (assetsToSave.length) {
          saveAsZip(assetsToSave, getIndexedFileName(downloadFileName, downloadedZIPFileCount), saveFiles, resolvePromise);
        } else {
          resolvePromise();
        }
      }
    };

    var onSuccess = function (asset, result) {
      var savedAssetInfo;
      statusCallback(++downloadedAssetCount);

      if (result.byteLength > maxZIPSize) { //downloading separately because of 2gb limit
        ++largeFileCount;
        saveFiles({
          content: new Blob([result]),
          downloadFileName: asset.name
        });
      } else {
        savedAssetInfo = { result: result, asset: asset };
      }

      testAndSave(savedAssetInfo);
    };
    var onFailure = function (asset) {
      failedAssetList.push(asset);
      ++failedAssetCount;
      testAndSave();
    };

    assets.forEach(function (asset) {
      fetcher(asset.src, onSuccess.bind(this, asset), onFailure.bind(this, asset));
    });

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