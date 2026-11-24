import { DEFAULT_HELPER_URL, isLocalHelperUrl } from './lib/helper.js'

const api = globalThis.browser ?? globalThis.chrome

const fields = {
  helperUrl: document.getElementById('helperUrl'),
  isEnabled: document.getElementById('isEnabled'),
}

async function saveOptions() {
  const helperUrl = fields.helperUrl.value.trim().replace(/\/+$/, '')
  const status = document.getElementById('status')

  if (!isLocalHelperUrl(helperUrl)) {
    status.style.color = 'crimson'
    status.textContent = 'The dev server must run on this machine: http://127.0.0.1:5173 or http://localhost:5173.'
    return
  }

  await api.storage.local.set({ helperUrl, isEnabled: fields.isEnabled.checked })

  fields.helperUrl.value = helperUrl
  status.style.color = 'green'
  status.textContent = 'Options saved.'
  setTimeout(() => {
    status.innerHTML = '&nbsp;'
  }, 1500)
}

// Everything the extension talks to. Chrome grants these when it installs the extension, Firefox
// leaves them for the user to allow.
const origins = [
  'https://rateyourmusic.com/*',
  'https://cdn.sonemic.net/*',
  'http://127.0.0.1/*',
  'http://localhost/*',
]

async function showAccess() {
  const allowed = await api.permissions.contains({ origins })
  const access = document.getElementById('access')
  access.style.color = allowed ? 'green' : 'crimson'
  access.textContent = allowed
    ? 'Allowed.'
    : 'Not allowed yet. Click the button below, then reload the RateYourMusic page.'
  document.getElementById('grant').hidden = allowed
}

// permissions.request needs a click, so it lives behind a button
async function grantAccess() {
  await api.permissions.request({ origins })
  await showAccess()
}

async function restoreOptions() {
  const items = await api.storage.local.get({ helperUrl: DEFAULT_HELPER_URL, isEnabled: true })
  fields.helperUrl.value = items.helperUrl
  fields.isEnabled.checked = items.isEnabled
  await showAccess()
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click', saveOptions)
document.getElementById('grant').addEventListener('click', grantAccess)
