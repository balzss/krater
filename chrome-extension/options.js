// Saves options to chrome.storage.sync
function saveOptions() {
  const apiUrl = document.getElementById('apiUrl').value
  // Basic check: ensure URL doesn't end with a slash unless it's just "http://host/"
  const cleanedApiUrl = apiUrl.replace(/\/+$/, '') // Remove trailing slashes
  const isEnabled = document.getElementById('isEnabled').checked

  chrome.storage.sync.set({ apiUrl: cleanedApiUrl, isEnabled: isEnabled }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status')
    status.textContent = 'Options saved.'
    // Reflect the cleaned URL back in the input field
    document.getElementById('apiUrl').value = cleanedApiUrl
    setTimeout(() => {
      status.textContent = ''
    }, 1500)
  })
}

// Restores options using the preferences stored in chrome.storage.sync.
function restoreOptions() {
  // Use default values: localhost API and extension enabled by default.
  chrome.storage.sync.get(
    { apiUrl: 'http://localhost:3000/api', isEnabled: true }, // Default values
    (items) => {
      document.getElementById('apiUrl').value = items.apiUrl
      document.getElementById('isEnabled').checked = items.isEnabled
    }
  )
}

// Add event listeners once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click', saveOptions)
