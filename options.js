// Saves settings to chrome.storage
function save_settings() {

  var computer = document.getElementById('computer').value;
  var target_root = document.getElementById('target_root').value;
  var target_folder = document.getElementById('target_folder').value;
  var s3_key_id = document.getElementById('s3_key_id').value;
  var s3_key_secret = document.getElementById('s3_key_secret').value;
  var s3_bucket = document.getElementById('s3_bucket').value;
  var s3_region = document.getElementById('s3_region').value;

  chrome.storage.local.set({
    computer: computer,
    target_root: target_root,
    target_folder: target_folder.replace(/^\/|\/$/g, ''), // remove forward and trailing slashes
    s3_key_id: s3_key_id,
    s3_key_secret: s3_key_secret,
    s3_bucket: s3_bucket,
    s3_region: s3_region,
    sync_file: 'jason.bsync'
  }, function() {
    document.getElementById('status').textContent = 'settings saved ' + new Date().toUTCString();
  });
}

// Restores select box and checkbox state using the preferences stored in chrome.storage
function restore_settings() {
  chrome.storage.local.get({
      computer: 'home',
      target_root: 'bar',
      target_folder: '',
      s3_key_id: '',
      s3_key_secret: '',
      s3_bucket: '',
      s3_region: '',
    }, function(items) {
      document.getElementById('computer').value = items.computer;
      document.getElementById('target_root').value = items.target_root;
      document.getElementById('target_folder').value = items.target_folder;
      document.getElementById('s3_key_id').value = items.s3_key_id;
      document.getElementById('s3_key_secret').value = items.s3_key_secret;
      document.getElementById('s3_bucket').value = items.s3_bucket;
      document.getElementById('s3_region').value = items.s3_region;
    });
}

// Sets event listeners
document.addEventListener('DOMContentLoaded', restore_settings);
document.getElementById('save').addEventListener('click', save_settings);
