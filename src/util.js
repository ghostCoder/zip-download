export const getExtension = name => name.substr(name.lastIndexOf("."));

export const getNameFromUrl = src => (src.substr(1 + src.lastIndexOf("/")).split('?')[0]).split('#')[0];

export const getExtensionFromUrl = src => getExtension(getNameFromUrl(src));


export const getAssetFileName = (assetName, assetSrc) => {
  let name = assetName ? assetName.trim() : getNameFromUrl(assetSrc);
  const extension = getExtensionFromUrl(assetSrc);
  if (extension !== getExtension(name)) {
    name = `${name}${extension}`;
  }
  return name.replace(/\//g, ' ');
};


export const getIndexedFileName = (downloadFileName, index) => {
  if (index > 0) {
    downloadFileName = `${downloadFileName}_${index}`;
  }
  return downloadFileName;
};

export const numeriseFileName = (fileName, num) => {
  const extension = getExtension(fileName),
    fileNameMinusExtension = fileName.replace(/\.[^/.]+$/, "");

  return `${fileNameMinusExtension}_${num}${extension}`;
};

export const queue = (func, waitTime) => {
  var funcQueue = [];
  var isWaiting;

  var executeFunc = function (params) {
    isWaiting = true;
    func(params);
    setTimeout(play, waitTime);
  };

  var play = function () {
    isWaiting = false;
    if (funcQueue.length) {
      var params = funcQueue.shift();
      executeFunc(params);
    }
  };

  return function (params) {
    if (isWaiting) {
      funcQueue.push(params);
    } else {
      executeFunc(params);
    }
  }
};