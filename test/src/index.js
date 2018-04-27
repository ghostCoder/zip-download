import {SMALL_ASSETS} from './assets';
import downloader from '../../lib/downloader';

const options = {
  downloadFileName: 'folder',
  statusCallback: (count)=> {
    console.log("downloaded: "+ count);
  },
  onComplete: (obj)=> {
    console.log(obj);
  },
};

document.getElementById("downloadBtn").addEventListener("click", downloader.bind(null, SMALL_ASSETS, options));
