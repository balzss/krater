// Listen for the browser action (toolbar icon) click
chrome.action.onClicked.addListener((_tab) => {
  // Open the options page.
  chrome.runtime.openOptionsPage()
})

console.log('Krater Extension background service worker started.') // For debugging
