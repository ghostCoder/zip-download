# zip-downloader

Zip-downloader can be used to download multiple files bundled into one or more zip files.

You can give zip-downloader an array of assets to download and it can download them internally and bundle them in zip(s) and download the final zip(s).

Test it out here: http://bit.ly/zip-downloader

## Options that you can pass 

**downloadFileName (String)** - Name of the zipped file downloaded.

Default: `zipped_files`

**maxZIPSize (Integer)** - Maximum size of the zip file downloaded. If total downloaded file size increases this, it will be split into multiple zips.  

Default: `2000000000` (2GB). The maximum possible value for `maxZIPSize` is 2GB as of now.

**downloadBigFiles (Boolean)** - If false, files greater than `maxZIPSize` are not downloaded. If true, those files are downloaded separately. 

Default: `true` 

**statusCallback (Function)** - This function is called whenever the download status changes for any file being downloaded. It can be used to update the download status. It is passed the count of downloaded assets till that moment.

**onComplete (Function)** - This is called on completion of the download. When it is called, it is passed a summary object of the download. That object contains - 

* numberOfDownloadedAssets
* numberOfFailedAssets
* numberOfLargeUnZippedAssets
* numberOfDownloadedZIPFiles
* failedAssetList - array of data of assets for which download failed.    
 


## Usage example  
                 

```javascript

import downloader from 'zip-downloader'; 
 
var assets = [
    {
        src, //src of the asset (image, video, pdf, anything)
        name, // name of the downloaded file for this asset (optional)
    }
];

var options = {
    downloadFileName: 'zipped',
    statusCallback: function(downloadedTillNow){
        console.log('Download status:' + ((downloadedTillNow * 100)/assets.length));
    },
    onComplete = function(downloadedSummary){
        console.log('Assets downloaded:' + downloadedSummary.numberOfDownloadedAssets);
        console.log('Assets failed:' + downloadedSummary.numberOfFailedAssets);
        console.log('Large Assets downloaded(over maxZIPSize):' + downloadedSummary.numberOfLargeUnZippedAssets);
        console.log('Number of zip files downloaded:' + downloadedSummary.numberOfDownloadedZIPFiles);
        console.log('Array of failed assets:');
        console.log(downloadedSummary.failedAssetList);
    },
};

downloader(assets, options);

```


## Limits
Using this we can only download zip files of maximum 2GB. This is a limitation as of now. But we can work towards fixing it.

## License
[MIT](./LICENSE)