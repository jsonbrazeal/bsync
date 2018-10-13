function showHideTargetFolder() {
  var computer = document.getElementById('computer');
  var targetFolderElems = document.querySelectorAll('.targetFolder');
  if (computer.value === 'home') {
    targetFolderElems.forEach(function(elem) {
      elem.classList.remove('d-none');
    });
  } else {
    targetFolderElems.forEach(function(elem) {
      elem.classList.add('d-none');
    });
  }
}


// Saves options to chrome.storage
function saveOptions() {

  var computer = document.getElementById('computer').value;
  var targetFolder = document.getElementById('targetFolder').value;
  var s3KeyId = document.getElementById('s3KeyId').value;
  var s3KeySecret = document.getElementById('s3KeySecret').value;
  var s3Bucket = document.getElementById('s3Bucket').value;
  var s3Region = document.getElementById('s3Region').value;
  var lastModified = new Date().toString();
  var options = {computer: computer, targetFolder: targetFolder, s3KeyId: s3KeyId, s3KeySecret: s3KeySecret, s3Bucket: s3Bucket, s3Region: s3Region, lastModified: lastModified};

  if (options['computer'] == 'remote') {
    targetFolder = '';
    document.getElementById('targetFolder').value = '';
  }

  chrome.storage.local.set({
    computer: computer,
    targetFolder: targetFolder.replace(/^\/|\/$/g, ''), // remove forward and trailing slashes
    s3KeyId: s3KeyId,
    s3KeySecret: s3KeySecret,
    s3Bucket: s3Bucket,
    s3Region: s3Region,
    syncFile: 'config.bsync',
    lastModified: lastModified
  }, function() {
    document.getElementById('status').innerHTML = '&nbsp;';
    document.getElementById('status').classList.remove('fadeIn');
    setTimeout(function() {
      document.getElementById('status').textContent = 'options saved ' + lastModified;
      document.getElementById('status').classList.add('fadeIn');
    }, 100);

    var configErrors = false;
    for (var key in options) {
      if ((options[key] === '') && (key !== 'targetFolder')) {
        configErrors = true;
      }
    }
    if ((options['computer'] == 'home') && (!(options['targetFolder']))) {
      configErrors = true;
    }
    if (configErrors) {
      // chrome.extension.getBackgroundPage().console.log('nope!')
      chrome.extension.getBackgroundPage().alert('Sync not enabled because bsync is not fully configured. Please finish configuration in extension options.');
      chrome.extension.getBackgroundPage().console.log('\u{1F4BB} incomplete options saved ' + lastModified);
    } else {
      chrome.extension.getBackgroundPage().console.log('\u{1F4BB} ' + computer + ' computer options saved ' + lastModified);
      chrome.extension.getBackgroundPage().console.log('\u{23F1} creating alarm...sync will occur every 5 minutes starting in 1 minute');
      chrome.alarms.create('bsync', {
        delayInMinutes: 1,
        periodInMinutes: 5
      });
      document.addEventListener('keydown', function(event) {
        const key = event.key; // Or const {key} = event; in ES6+
        if (key === 'Escape') {
          window.close();
        }
      });
    } // if options.includes(null)
  }); // chrome.storage.local.set
} // saveOptions

// Restores select box and checkbox state using the preferences stored in chrome.storage
function restoreOptions() {
  document.addEventListener('change', showHideTargetFolder);
  chrome.storage.local.get({
    computer: '',
    targetFolder: '',
    s3KeyId: '',
    s3KeySecret: '',
    s3Bucket: '',
    s3Region: '',
    lastModified: ''
  }, function(items) {
    document.getElementById('computer').value = items.computer;
    document.getElementById('targetFolder').value = items.targetFolder;
    document.getElementById('s3KeyId').value = items.s3KeyId;
    document.getElementById('s3KeySecret').value = items.s3KeySecret;
    document.getElementById('s3Bucket').value = items.s3Bucket;
    document.getElementById('s3Region').value = items.s3Region;
    if (items.lastModified) {
      document.getElementById('status').textContent = '';
      document.getElementById('status').classList.remove('fadeIn');
      document.getElementById('status').classList.add('fadeIn');
      document.getElementById('status').textContent = 'options saved ' + items.lastModified;
    }
    showHideTargetFolder();
  }); // chrome.storage.local.get
} // restoreOptions

// Sets event listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
