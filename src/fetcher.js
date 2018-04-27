const fetchFile = (url, onSuccess, onFailure) => {
  var xhr = new XMLHttpRequest();
  xhr.open('get', url);
  xhr.responseType = 'blob';
  xhr.onload = function () {
    if (this.status == 200) {
      var fr = new FileReader();

      fr.onload = function () {
        onSuccess(this.result);
      };

      fr.readAsArrayBuffer(xhr.response); // async call
    }
  };
  xhr.onreadystatechange = function () {
    if (this.readyState === 4 && this.status !== 200) {
      onFailure();
      //console.log('error in onreadystatechange ' + this.status + '- ' + url)
    }
  };

  xhr.send();
};

export default (url, onSuccess, onFailure) => {
  fetchFile(url, onSuccess, function () {
    fetchFile(url, onSuccess, onFailure); // retrying once
  });
};