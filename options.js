// Saves settings to chrome.storage
function saveSettings() {

  var computer = document.getElementById('computer').value;
  var targetRoot = document.getElementById('targetRoot').value;
  var targetFolder = document.getElementById('targetFolder').value;
  var s3KeyId = document.getElementById('s3KeyId').value;
  var s3KeySecret = document.getElementById('s3KeySecret').value;
  var s3Bucket = document.getElementById('s3Bucket').value;
  var s3Region = document.getElementById('s3Region').value;
  var lastModified = new Date().toUTCString();

  chrome.storage.local.set({
    computer: computer,
    targetRoot: targetRoot,
    targetFolder: targetFolder.replace(/^\/|\/$/g, ''), // remove forward and trailing slashes
    s3KeyId: s3KeyId,
    s3KeySecret: s3KeySecret,
    s3Bucket: s3Bucket,
    s3Region: s3Region,
    syncFile: 'jason.bsync',
    lastModified: lastModified
  }, function() {
    document.getElementById('status').textContent = 'settings saved ' + lastModified;
    chrome.extension.getBackgroundPage().console.log(computer + ' computer settings saved ' + lastModified);
    chrome.extension.getBackgroundPage().console.log('\u{23F1} alarm created...sync will occur every 5 minutes starting in 1 minute');
    chrome.alarms.create('bsync', {
      delayInMinutes: 1,
      periodInMinutes: 5
    });
    document.addEventListener('keydown', function(event) {
      const key = event.key; // Or const {key} = event; in ES6+
      if (key === "Escape") {
        window.close();
      }
    });
  }); // chrome.storage.local.set
} // saveSettings

// Restores select box and checkbox state using the preferences stored in chrome.storage
function restoreSettings() {
  chrome.storage.local.get({
    computer: '',
    targetRoot: '',
    targetFolder: '',
    s3KeyId: '',
    s3KeySecret: '',
    s3Bucket: '',
    s3Region: '',
    lastModified: ''
  }, function(items) {
    document.getElementById('computer').value = items.computer;
    document.getElementById('targetRoot').value = items.targetRoot;
    document.getElementById('targetFolder').value = items.targetFolder;
    document.getElementById('s3KeyId').value = items.s3KeyId;
    document.getElementById('s3KeySecret').value = items.s3KeySecret;
    document.getElementById('s3Bucket').value = items.s3Bucket;
    document.getElementById('s3Region').value = items.s3Region;
    if (items.lastModified) {
      document.getElementById('status').textContent = 'settings saved ' + items.lastModified;
    }
  }); // chrome.storage.local.get
} // restoreSettings

// Sets event listeners
document.addEventListener('DOMContentLoaded', restoreSettings);
document.getElementById('save').addEventListener('click', saveSettings);
