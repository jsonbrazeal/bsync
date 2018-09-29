function dataURItoBlob (dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    // write the ArrayBuffer to a blob, and you're done
    return new Blob([ab],{type: mimeString});
}


chrome.runtime.onInstalled.addListener(function(details) {

  console.log(details);
  AWS.config.update({accessKeyId: '', secretAccessKey: ''});
  AWS.config.region = 'us-west-2';
  // AWS.config.s3_host_name = 'bsync-data.s3-us-west-2.amazonaws.com';
  // var canvas  = document.getElementById("imagePreviewChatFooter");
  // var dataUrl = canvas.toDataURL("image/jpeg");
  // var dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
  var base64Text = btoa('Hello World');
  var dataUrl = "data:text/plain;base64," + base64Text
  var blobData = dataURItoBlob(dataUrl);
  var bucketName = 'bsync-data';
  // var fileName = 'canvas.png';
  var fileName = 'hi.txt';
  // var fileType = 'image/png';
  var fileType = 'plain/text';
  var params = {Bucket: bucketName}
  var s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: params
  });
  // var params = {Key: fileName, ContentType: fileType, Body: blobData}
  // s3.putObject(params, function (err, data) {
  //   console.log(err ? 'ERROR: ' + err.toString() : 'UPLOADED.');
  //   console.log(data);
  // });

  var params = {
    Bucket: bucketName,
    Key: fileName
  };
  s3.getObject(params, function(err, data) {
    console.log(err ? 'ERROR: ' + err.toString() : 'DOWNLOADED.');
    console.log(data);
    console.log(data.Body.toString());
  });

});

// Observe bookmark modifications and revert any modifications made to managed
// bookmarks. The tree is always reloaded in case the events happened while the
// page was inactive.

// chrome.bookmarks.onMoved.addListener(function(id, info) {
//   tree.load(function() {
//     var managedNode = tree.getById(id);
//     if (managedNode && !managedNode.isRoot()) {
//       managedNode.moveInModel(info.parentId, info.index, function(){});
//     } else {
//       // Check if the parent node has managed children that need to move.
//       // Example: moving a non-managed bookmark in front of the managed
//       // bookmarks.
//       var parentNode = tree.getById(info.parentId);
//       if (parentNode)
//         parentNode.reorderChildren();
//     }
//   });
// });

// chrome.bookmarks.onChanged.addListener(function(id, info) {
//   tree.load(function() {
//     var managedNode = tree.getById(id);
//     if (!managedNode || managedNode.isRoot())
//       return;
//     chrome.bookmarks.update(id, {
//       'title': managedNode._title,
//       'url': managedNode._url
//     });
//   });
// });

// chrome.bookmarks.onRemoved.addListener(function(id, info) {
//   tree.load(function() {
//     var managedNode = tree.getById(id);
//     if (!managedNode || managedNode.isRoot())
//       return;
//     // A new tree.store() is needed at the end because the regenerated nodes
//     // will have new IDs.
//     var callbackChain = new CallbackChain();
//     callbackChain.push(tree.store.bind(tree));
//     managedNode.regenerate(info.parentId, info.index, callbackChain);
//   });
// });






// // Important note: if you make an extension with an Event page ("persistent": false in the manifest), setInterval with 5-minute interval will fail as the background page will get unloaded.

// // If your extension uses window.setTimeout() or window.setInterval(), switch to using the alarms API instead. DOM-based timers won't be honored if the event page shuts down.

// // In this case, you need to implement it using chrome.alarms API:

// chrome.alarms.create("5min", {
//   delayInMinutes: 5,
//   periodInMinutes: 5
// });

// chrome.alarms.onAlarm.addListener(function(alarm) {
//   if (alarm.name === "5min") {
//     doStuff();
//   }
// });

// // In case of persistent background pages, setInterval is still an acceptable solution.
