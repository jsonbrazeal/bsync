function dataURItoBlob(dataURI) {
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

function uploadToS3(data) {
  var base64Text = btoa(data);
  var dataUrl = 'data:text/plain;base64,' + base64Text
  var blobData = dataURItoBlob(dataUrl);
  chrome.storage.local.get({
    s3Bucket: '',
    s3Region: '',
    s3KeyId: '',
    s3KeySecret: '',
    syncFile: '',
  }, function(items) {
    if (!(items.s3Bucket && items.syncFile, items.s3Region && items.s3KeySecret && items.s3KeyId)) {
      alert('bsync is not correctly configured for uploadToS3 operation');
      chrome.runtime.openOptionsPage();
      return;
    }
    AWS.config.update({accessKeyId: items.s3KeyId, secretAccessKey: items.s3KeySecret});
    AWS.config.region = items.s3Region;
    var s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: items.s3Bucket}
    });
    var params = {Key: items.syncFile, ContentType: 'plain/text', Body: blobData}
    s3.putObject(params, function (err, data) {
      if (err) {
        console.log('⚠️ error: ' + err.toString());
        alert('bsync uploadToS3 error: ' + err.toString());
      } else {
        console.log('😎 sync done');
      }
    });
  });
}

function downloadFromS3() {
  chrome.storage.local.get({
    s3Bucket: '',
    s3Region: '',
    s3KeyId: '',
    s3KeySecret: '',
    syncFile: '',
    targetFolder: ''
  }, function(items) {
    if (!(items.s3Bucket && items.syncFile && items.s3Region && items.s3KeySecret && items.s3KeyId && items.targetFolder)) {
      alert('bsync is not correctly configured for downloadFromS3 operation');
      chrome.runtime.openOptionsPage();
    }
    AWS.config.update({accessKeyId: items.s3KeyId, secretAccessKey: items.s3KeySecret});
    AWS.config.region = items.s3Region;
    var s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: items.s3Bucket}
    });
    var params = {
      Bucket: items.s3Bucket,
      Key: items.syncFile
    };
    s3.getObject(params, function(err, data) {
      if (err) {
        console.log('⚠️ error: ' + err.toString());
        alert('bsync downloadFromS3 error: ' + err.toString());
      } else {
        console.log('🤓 downloaded bookmarks');
        // bookmarks = JSON.parse(decodeURIComponent(escape(window.atob(data.Body.toString()))))
        bookmarks = JSON.parse(data.Body.toString())
        replaceInHomeTree(bookmarks, items.targetFolder);
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(function(details) {
  console.log('☀️ bsync loaded: ' + JSON.stringify(details));
  chrome.runtime.openOptionsPage();
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'bsync') {
    console.log('🌎 bsync starting ' + new Date().toUTCString());
    chrome.storage.local.get({
      s3Bucket: '',
      s3Region: '',
      s3KeyId: '',
      s3KeySecret: '',
      syncFile: '',
      targetFolder: ''
    }, function(items) {
      if (items.s3Bucket && items.syncFile && items.s3Region && items.s3KeySecret && items.s3KeyId && items.targetFolder) {
        performSync();
      } else {
        console.log('⚠️ bsync is not configured correctly and will not sync. Please open options and configure extension.');
      }
    } // chrome.storage.local.get callback
    ); // chrome.storage.local.get
  } // if (alarm.name === 'bsync')
}); // chrome.alarms.onAlarm.addListener

function performSync() {
  chrome.storage.local.get({
    computer: ''
  }, function(items) {
    if (items.computer == 'remote') {
      var bookmarkTreeNodes = chrome.bookmarks.getTree(
        function(bookmarkTreeNodes) {
          var bookmarkTreeNodesString= unescape(encodeURIComponent(JSON.stringify(bookmarkTreeNodes)));
          uploadToS3(bookmarkTreeNodesString);
        }
      );
    } else if (items.computer == 'home') {
      downloadFromS3();
    } else {
      console.log('⁉️ unknown computer settings ' + items.computer);
    }
  });
}

function dfs(root, target) {
  if (root.title == target) {
    return root
  }

  if (root.children && root.children.length) {
    // folder
    for (let node of root.children) {
      result = dfs(node, target);
      if (result && (result.title == target)) {
        return result
      }
    }
  }

}

function createBookmarkNodes(parentId, bookmarks) {
  bookmarks.forEach(function(bm) {
    chrome.bookmarks.create({
      parentId: parentId,
      title: bm.title,
      url: bm.url,
      index: bm.index
    }, function(result) {
      if (bm.children && bm.children.length > 0) {
        createBookmarkNodes(result.id, bm.children);
      }
    });
  });
}

function replaceInHomeTree(bookmarks, targetFolder) {

  chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {
      var targetNode = dfs(bookmarkTreeNodes[0], targetFolder);
      console.log('😎 replacing bookmarks in targetFolder (' + targetFolder + ')');
      // remove old target node
      chrome.bookmarks.removeTree(targetNode.id, function() {
        // recreate old target node
        chrome.bookmarks.create({
          parentId: targetNode.parentId,
          title: targetNode.title,
          url: targetNode.url,
          index: targetNode.index,
        }, function(newTarget) {
          createBookmarkNodes(newTarget.id, bookmarks[0]['children']);
        }); // chrome.bookmarks.create
      }); // chrome.bookmarks.removeTree
    } // chrome.bookmarks.getTree callback
  ); // chrome.bookmarks.getTree

} // replaceInHomeTree

// // Observe bookmark modifications and revert any modifications made to managed
// // bookmarks. The tree is always reloaded in case the events happened while the
// // page was inactive.

// chrome.bookmarks.onCreated.addListener(function(id, info) {
//   console.log('bookmark created:');
//   console.log(info);
//   console.log('uploading to s3');
//   // uploadToS3('{ "bookmark": "created" }');
//   // downloadFromS3();
// });

// chrome.bookmarks.onChildrenReordered.addListener(function(id, info) {
//   console.log('bookmark children reordered');
//   console.log(info);
// });

// chrome.bookmarks.onImportEnded.addListener(function(id, info) {
//   console.log('bookmark import ended');
//   console.log(info);
// });

// chrome.bookmarks.onMoved.addListener(function(id, info) {
//   // tree.load(function() {
//   //   var managedNode = tree.getById(id);
//   //   if (managedNode && !managedNode.isRoot()) {
//   //     managedNode.moveInModel(info.parentId, info.index, function(){});
//   //   } else {
//   //     // Check if the parent node has managed children that need to move.
//   //     // Example: moving a non-managed bookmark in front of the managed
//   //     // bookmarks.
//   //     var parentNode = tree.getById(info.parentId);
//   //     if (parentNode)
//   //       parentNode.reorderChildren();
//   //   }
//   // });
//   console.log('bookmark moved');
//   console.log(info);
// });

// chrome.bookmarks.onChanged.addListener(function(id, info) {
//   // tree.load(function() {
//   //   var managedNode = tree.getById(id);
//   //   if (!managedNode || managedNode.isRoot())
//   //     return;
//   //   chrome.bookmarks.update(id, {
//   //     'title': managedNode._title,
//   //     'url': managedNode._url
//   //   });
//   // });
//   console.log('bookmark changed');
//   console.log(info);
// });

// chrome.bookmarks.onRemoved.addListener(function(id, info) {
//   // tree.load(function() {
//   //   var managedNode = tree.getById(id);
//   //   if (!managedNode || managedNode.isRoot())
//   //     return;
//   //   // A new tree.store() is needed at the end because the regenerated nodes
//   //   // will have new IDs.
//   //   var callbackChain = new CallbackChain();
//   //   callbackChain.push(tree.store.bind(tree));
//   //   managedNode.regenerate(info.parentId, info.index, callbackChain);
//   // });
//   console.log('bookmark removed');
//   console.log(info);
// });
