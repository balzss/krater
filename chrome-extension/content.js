// --- Helper Functions (Modified to accept apiUrl) ---

async function checkArtistsAndRelease(apiUrl, { artistIds, releaseId }) {
  try {
    // Use apiUrl passed as argument
    const result = await fetch(
      `${apiUrl}/check?artistId=${artistIds.join(',')}&releaseId=${releaseId}`
    )
    if (!result.ok) {
      throw new Error(`API Check Failed: ${result.status} ${result.statusText}`)
    }
    const { missingArtists, missingRelease } = await result.json()
    return {
      missingArtists,
      missingRelease,
    }
  } catch (error) {
    console.error('Krater Extension: Error checking artists/release:', error)
    return { error } // Propagate error
  }
}

async function addArtists(apiUrl, artistsInfo) {
  // Use apiUrl passed as argument
  try {
    const response = await fetch(`${apiUrl}/artists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(artistsInfo),
    })
    if (!response.ok) {
      throw new Error(`API Add Artists Failed: ${response.status} ${response.statusText}`)
    }
    console.log('Krater Extension: Artists added/updated successfully.')
  } catch (error) {
    console.error('Krater Extension: Error adding artists:', error)
    // Decide how to handle this error - maybe alert the user?
    alert(`Failed to add artists: ${error.message}`)
    throw error // Re-throw if the calling function needs to know
  }
}

async function addRelease(apiUrl, artistIds, update = false) {
  // Use apiUrl passed as argument
  const title = document.querySelector('.album_title')?.innerText
  const rymId = document.querySelector('input.album_shortcut')?.value
  const rymUrl = window.location.origin + window.location.pathname
  const coverElement = document.querySelector('.page_release_art_frame img')
  const coverSrc = coverElement?.src
  const spotifyLink = document.querySelector('a.ui_media_link_btn_spotify')?.href

  // Basic validation
  if (!title || !rymId || !coverSrc || !artistIds || artistIds.length === 0) {
    console.error('Krater Extension: Missing required release information on the page.')
    alert(
      'Could not find all required release information (Title, RYM ID, Cover, Artists) on the page.'
    )
    throw new Error('Missing required release information on the page.') // Throw error to stop execution flow
  }

  const coverFileName = coverSrc.split('/').slice(-1)[0].split('.')[0] + '.webp' // Assume conversion/naming convention

  try {
    // Fetch cover image blob
    const imgResponse = await fetch(coverSrc)
    if (!imgResponse.ok) {
      throw new Error(
        `Failed to fetch cover image: ${imgResponse.status} ${imgResponse.statusText}`
      )
    }
    const blob = await imgResponse.blob()

    // Prepare form data
    const formData = new FormData()
    formData.append('coverImage', blob, coverFileName)
    formData.append('title', title)
    formData.append('rymId', rymId)
    formData.append('rymUrl', rymUrl)
    formData.append('cover', coverFileName) // Sending filename again? Check if API needs this
    formData.append('artistRymIds', JSON.stringify(artistIds))
    if (spotifyLink) {
      formData.append('media', JSON.stringify({ spotify: spotifyLink }))
    } else {
      formData.append('media', JSON.stringify({})) // Send empty media object if no spotify link
    }

    // Make API call
    const releaseResponse = await fetch(`${apiUrl}/releases`, {
      method: update ? 'PUT' : 'POST',
      body: formData, // FormData sets Content-Type automatically
    })

    if (!releaseResponse.ok) {
      // Try to get more specific error from API response body if possible
      let errorDetails = `${releaseResponse.status} ${releaseResponse.statusText}`
      try {
        const errorData = await releaseResponse.json()
        errorDetails += ` - ${errorData.message || JSON.stringify(errorData)}`
      } catch (_e) {
        /* Ignore if response is not JSON */
      }
      throw new Error(`API Add/Update Release Failed: ${errorDetails}`)
    }

    console.log(`Krater Extension: Release ${update ? 'updated' : 'added'} successfully.`)
  } catch (error) {
    console.error(`Krater Extension: Error ${update ? 'updating' : 'adding'} release:`, error)
    alert(`Failed to ${update ? 'update' : 'add'} release: ${error.message}`)
    throw error // Re-throw
  }
}

async function removeRelease(apiUrl, releaseId) {
  // Use apiUrl passed as argument
  try {
    const response = await fetch(`${apiUrl}/releases?rymId=${releaseId}`, {
      method: 'DELETE',
      // No headers usually needed for simple DELETE unless API requires Accept or Auth
    })
    if (!response.ok) {
      throw new Error(`API Remove Release Failed: ${response.status} ${response.statusText}`)
    }
    console.log('Krater Extension: Release removed successfully.')
  } catch (error) {
    console.error('Krater Extension: Error removing release:', error)
    alert(`Failed to remove release: ${error.message}`)
    throw error // Re-throw
  }
}

// --- UI Functions (Using CSS Classes) ---

function createKraterBtn() {
  const kraterBtn = document.createElement('button')
  kraterBtn.id = 'krater-action-button'
  // Add base class and initial loading state class
  kraterBtn.classList.add('krater-button', 'krater-button-loading')
  kraterBtn.textContent = 'Loading Krater...'
  kraterBtn.disabled = true // Start disabled

  const pageSection = document.querySelector('.page_section') // Target for button insertion
  if (pageSection) {
    pageSection.prepend(kraterBtn)
  } else {
    console.warn("Krater Extension: Could not find '.page_section' to insert button.")
  }
  return kraterBtn
}

// Modified createRefreshBtn to use classes
function createRefreshBtn(apiUrl, artistIds) {
  const refreshBtn = document.createElement('button')
  refreshBtn.id = 'krater-refresh-button'
  // Add base class and refresh specific class
  refreshBtn.classList.add('krater-button', 'krater-button-refresh')
  refreshBtn.textContent = 'Refresh data'

  refreshBtn.onclick = async () => {
    if (
      !window.confirm(
        'Do you want to refresh the release data in Krater with the current page info?'
      )
    ) {
      return
    }
    const originalText = refreshBtn.textContent
    refreshBtn.textContent = 'Refreshing...'
    refreshBtn.disabled = true // Disable button visually via CSS :disabled state
    try {
      // Use apiUrl passed to the function
      await addRelease(apiUrl, artistIds, true) // true for update
      refreshBtn.textContent = 'Refreshed!'
      setTimeout(() => {
        // Reset text after a delay
        refreshBtn.textContent = originalText
        refreshBtn.disabled = false // Re-enable
      }, 1500)
    } catch (_error) {
      // Error already logged and alerted in addRelease
      refreshBtn.textContent = 'Refresh Failed'
      setTimeout(() => {
        // Reset text after a delay
        refreshBtn.textContent = originalText
        refreshBtn.disabled = false // Re-enable
      }, 3000)
    }
  }
  return refreshBtn
}

// --- Data Extraction ---

function getArtistAndReleaseInfo() {
  // Added checks for element existence
  const releaseIdElement = document.querySelector('input.album_shortcut')
  const releaseId = releaseIdElement ? releaseIdElement.value : null

  const artistElements = document.querySelectorAll('.album_info a.artist')
  const artists = Array.from(artistElements).map((artist) => ({
    displayName: artist.innerText,
    rymId: artist.title, // Assuming title attribute contains the ID
    rymUrl: artist.href,
  }))

  const artistIds = artists.map((artist) => artist.rymId).filter((id) => id) // Ensure no null/empty IDs

  if (!releaseId || artists.length === 0 || artistIds.length === 0) {
    console.error('Krater Extension: Could not extract valid Release ID or Artist IDs from page.')
    return null // Indicate failure
  }

  return {
    releaseId,
    artists,
    artistIds,
  }
}

// --- Main Logic ---

async function loadKrater(apiUrl) {
  console.log('Krater Extension: Initializing on page load for API:', apiUrl)

  // Check if API URL is provided (it should be, with default)
  if (!apiUrl) {
    console.error('Krater Extension: API URL is missing!')
    alert('Krater Extension Error: API URL is not configured. Please check extension options.')
    // Attempt to style the button if it was already created (though it shouldn't be if initialize checks first)
    const btn = document.getElementById('krater-action-button')
    if (btn) {
      btn.textContent = 'Config Error'
      btn.classList.remove('krater-button-loading')
      btn.classList.add('krater-button-error')
      btn.disabled = true
    }
    return
  }

  // Create the button first, show loading state - DO THIS HERE INSTEAD OF LATER
  const kraterBtn = createKraterBtn()

  const releaseInfo = getArtistAndReleaseInfo()
  if (!releaseInfo) {
    console.log('Krater Extension: Not enough info on page to proceed.')
    // Remove the loading button if we can't proceed
    kraterBtn.remove()
    return // Stop if we couldn't get basic info
  }
  const { releaseId, artists, artistIds } = releaseInfo

  // Check status against the API
  const { missingArtists, missingRelease, error } = await checkArtistsAndRelease(apiUrl, {
    artistIds,
    releaseId,
  })

  // Remove loading state and enable button (unless error occurred)
  kraterBtn.classList.remove('krater-button-loading')
  kraterBtn.disabled = false // Enable now, might be overridden below if error

  if (error) {
    console.error('Krater Extension: Failed to check API status.', error)
    kraterBtn.textContent = 'API Error'
    kraterBtn.classList.add('krater-button-error') // Add error class
    kraterBtn.disabled = true // Keep disabled on API error
    kraterBtn.title = `Error communicating with ${apiUrl}: ${error.message || 'Unknown error'}`
    return // Stop on API error
  }

  // --- Configure Button Based on API Check Result ---

  if (!missingRelease && (!missingArtists || !missingArtists.length)) {
    // Release and all artists exist
    kraterBtn.innerText = 'Remove from Krater'
    kraterBtn.classList.add('krater-button-remove') // Use remove class
    kraterBtn.onclick = async () => {
      if (!window.confirm('Do you want to remove this release from Krater?')) {
        return
      }
      const originalText = kraterBtn.textContent
      kraterBtn.textContent = 'Removing...'
      kraterBtn.disabled = true // Use :disabled style
      try {
        await removeRelease(apiUrl, releaseId)
        // Reload to reflect the change
        window.location.reload()
      } catch (_e) {
        // Error already handled in removeRelease
        kraterBtn.textContent = 'Remove Failed'
        setTimeout(() => {
          // Reset state after delay
          kraterBtn.textContent = originalText
          kraterBtn.disabled = false
        }, 3000)
      }
    }

    // Add refresh button only if the item is already in Krater
    kraterBtn.after(createRefreshBtn(apiUrl, artistIds))
  } else {
    // Release is missing OR some artists are missing (treat both as 'needs adding')
    let buttonText = 'Add to Krater'
    if (missingArtists && missingArtists.length > 0) {
      buttonText += ` (incl. ${missingArtists.length} artist${missingArtists.length > 1 ? 's' : ''})`
      console.log('Krater Extension: Missing artists:', missingArtists)
    }

    kraterBtn.innerText = buttonText
    kraterBtn.classList.add('krater-button-add') // Use add class
    kraterBtn.onclick = async () => {
      if (
        !window.confirm(
          `Do you want to add this release${missingArtists && missingArtists.length > 0 ? ' (and missing artists)' : ''} to Krater?`
        )
      ) {
        return
      }
      const originalText = kraterBtn.textContent
      kraterBtn.textContent = 'Adding...'
      kraterBtn.disabled = true // Use :disabled style

      try {
        // Add missing artists first (API might handle duplicates gracefully)
        // Assuming API handles duplicates:
        // Note: If addArtists fails, addRelease won't run due to thrown error
        if (missingArtists && missingArtists.length > 0) {
          // Determine which artists are actually missing if API needs only missing ones
          // const artistsToAdd = artists.filter(a => missingArtists.includes(a.rymId));
          // await addArtists(apiUrl, artistsToAdd);
          // OR just send all if API handles existing ones:
          await addArtists(apiUrl, artists)
        }

        // Add the release (will throw error if it fails)
        await addRelease(apiUrl, artistIds) // false for add (default)

        // Reload to reflect change only on full success
        window.location.reload()
      } catch (_e) {
        // Errors already handled in addArtists/addRelease via alert
        kraterBtn.textContent = 'Add Failed'
        setTimeout(() => {
          // Reset state after delay
          kraterBtn.textContent = originalText
          kraterBtn.disabled = false
        }, 3000)
      }
    }
  }
}

// --- Initialization ---

function initializeKraterExtension() {
  // Check if button already exists (e.g., from previous run if page uses SPA navigation)
  if (document.getElementById('krater-action-button')) {
    console.log('Krater Extension: Button already exists, skipping initialization.')
    return
  }

  // Get settings from storage
  chrome.storage.sync.get(
    // Set defaults: enabled=true, apiUrl=localhost
    { apiUrl: 'http://localhost:3000', isEnabled: true },
    (items) => {
      console.log('Krater Extension Settings Loaded:', items)
      const apiUrl = `${items.apiUrl}/api`
      if (items.isEnabled) {
        // If extension is enabled, run the main logic when the page finishes loading
        // Check if DOM is already ready or wait for 'load'
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          loadKrater(apiUrl)
        } else {
          window.addEventListener('load', () => loadKrater(apiUrl), { once: true })
        }
      } else {
        console.log('Krater Extension is disabled via settings.')
      }
    }
  )
}

// Start the process
initializeKraterExtension()

// Optional: Listen for storage changes (e.g., if user disables/enables via options page without reloading page)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.isEnabled !== undefined || changes.apiUrl !== undefined)) {
    console.log('Krater settings changed. Reloading page to apply changes.')
    // Simple approach: reload the page to ensure correct state
    window.location.reload()
    // More complex approach: try to update UI dynamically (add/remove button, update URLs in handlers)
    // initializeKraterExtension(); // This might add duplicate buttons if not handled carefully
  }
})
