// Client for the local Krater helper. It is part of the dev server (`npm run dev`) and edits the
// files in your clone.

export const DEFAULT_HELPER_URL = 'http://127.0.0.1:5173'

// Where the dev server mounts the helper
const HELPER_PATH = '/__krater'

// Only loopback is allowed so a typo can never send releases somewhere else
export const isLocalHelperUrl = (url) => /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)

export class HelperError extends Error {
  constructor(message, { unreachable = false, blocked = false } = {}) {
    super(message)
    this.unreachable = unreachable // nothing is listening
    this.blocked = blocked // something is listening, but the browser won't let the extension talk to it
  }
}

export async function callHelper(baseUrl, endpoint, payload) {
  let response
  try {
    response = await fetch(`${baseUrl}${HELPER_PATH}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Krater': '1' },
      body: JSON.stringify(payload),
    })
  } catch {
    // A no-cors request succeeds for any server that answers, so it tells "not running" apart
    // from "running, but this extension isn't allowed to call it" (missing site access)
    const answers = await fetch(baseUrl, { mode: 'no-cors' }).then(
      () => true,
      () => false
    )
    if (answers) {
      throw new HelperError(
        `Krater is running at ${baseUrl}, but the browser blocked the extension from reaching it. ` +
          'Allow site access for the extension on its settings page (in Firefox: about:addons, Save to Krater, Permissions).',
        { blocked: true }
      )
    }
    throw new HelperError(
      `Can't reach Krater at ${baseUrl}. Run "npm run dev" in your Krater clone.`,
      { unreachable: true }
    )
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.ok) {
    throw new HelperError(data.error || `Krater answered ${response.status}`)
  }
  return data
}
