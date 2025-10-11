#!/usr/bin/env node

import fs from 'fs'
import { execSync } from 'child_process'
import readline from 'readline'

/**
 * Version Bump Script
 * Analyzes changes and intelligently bumps version number with linting checks
 */

// Parse command line arguments
const args = process.argv.slice(2)
const skipLint = args.includes('--no-lint')
const skipPrompt = args.includes('--no-prompt')
const forcedBumpType = args.find((arg) => ['major', 'minor', 'patch', 'skip'].includes(arg))
const commitMsg = args.find(
  (arg) => !arg.startsWith('--') && !['major', 'minor', 'patch', 'skip'].includes(arg)
)

// Load configuration from package.json
let config = { lintBeforeBump: true, interactive: true, autoSkipInCI: true }
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  config = { ...config, ...(packageJson.versionBump || {}) }
} catch (err) {
  // Use defaults if config can't be loaded
}

/**
 * Detect if running in non-interactive/automated environment
 * @returns {boolean} True if in automated environment
 */
function isAutomatedEnvironment() {
  return (
    process.env.CI === 'true' ||
    process.env.CLAUDE_CODE === 'true' ||
    process.env.NON_INTERACTIVE === 'true' ||
    !process.stdin.isTTY
  )
}

/**
 * Run linting check on staged files only
 * @returns {boolean} True if lint passes, false otherwise
 */
function runLint() {
  console.log('🔍 Running lint check on staged files...')
  try {
    // Get staged JS/TS files
    const stagedFiles = execSync(
      'git diff --cached --name-only --diff-filter=ACM | grep -E "\\.(js|jsx|ts|tsx)$" || true',
      { encoding: 'utf8', shell: true }
    ).trim()

    if (!stagedFiles) {
      console.log('ℹ️  No JS/TS files staged for linting')
      return true
    }

    // Run eslint on staged files only
    execSync(`npx eslint --max-warnings=0 ${stagedFiles.split('\n').join(' ')}`, {
      stdio: 'inherit',
      shell: true,
    })
    return true
  } catch (error) {
    console.error('\n❌ Lint check failed!')
    console.error('Please fix linting errors in staged files before committing.')
    console.error('You can run "npm run lint" to see all errors.')
    console.error('Or use --no-lint flag to skip this check.')
    return false
  }
}

/**
 * Get current version from package.json
 * @returns {string} Current version
 */
function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    return packageJson.version || '0.0.0'
  } catch (err) {
    console.error('❌ Error reading package.json:', err.message)
    process.exit(1)
  }
}

/**
 * Parse semantic version into components
 * @param {string} version - Version string (e.g., "1.2.3")
 * @returns {{major: number, minor: number, patch: number}}
 */
function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number)
  return { major, minor, patch }
}

/**
 * Bump version based on type
 * @param {string} version - Current version
 * @param {string} bumpType - Type of bump (major/minor/patch)
 * @returns {string} New version
 */
function bumpVersion(version, bumpType) {
  const { major, minor, patch } = parseVersion(version)

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Invalid bump type: ${bumpType}`)
  }
}

/**
 * Get staged files from git
 * @returns {string[]} Array of staged file paths
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    return output
      .trim()
      .split('\n')
      .filter((f) => f)
  } catch (err) {
    console.error('❌ Failed to get staged files. Are you in a git repository?')
    console.error('   Error:', err.message)
    process.exit(1)
  }
}

/**
 * Check if file is new (added, not modified)
 * @param {string} file - File path
 * @returns {boolean}
 */
function isNewFile(file) {
  try {
    const output = execSync('git diff --cached --name-status', { encoding: 'utf8' })
    const lines = output.split('\n')
    // Check if any line starts with 'A' (Added) followed by tab and the file path
    return lines.some((line) => {
      const [status, path] = line.split('\t')
      return status === 'A' && path === file
    })
  } catch (err) {
    return false
  }
}

/**
 * Suggest version bump type based on commit message and files changed
 * @param {string} commitMsg - Commit message
 * @param {string[]} files - Array of changed files
 * @returns {string} Suggested bump type (major/minor/patch)
 */
function suggestBumpType(commitMsg, files) {
  // Check commit message for conventional commit keywords
  if (commitMsg) {
    if (commitMsg.includes('BREAKING CHANGE') || commitMsg.match(/^\w+!:/)) {
      return 'major'
    }
    if (commitMsg.match(/^feat(\(.*\))?:/)) {
      return 'minor'
    }
    if (commitMsg.match(/^fix(\(.*\))?:/)) {
      return 'patch'
    }
  }

  // Skip version bump for certain file types
  const skipPaths = config.skipPaths || ['README.md', 'docs/', '.test.', '.spec.', '__tests__/']

  // Separate meaningful files from documentation/test files
  const meaningfulFiles = files.filter((f) => !skipPaths.some((skip) => f.includes(skip)))

  // If only docs/tests changed, suggest skip
  if (meaningfulFiles.length === 0 && files.length > 0) {
    return 'skip'
  }

  // Analyze only meaningful files
  const hasApiChanges = meaningfulFiles.some((f) => f.includes('api/') || f.includes('routes/'))
  const hasNewComponents = meaningfulFiles.some((f) => f.includes('components/') && isNewFile(f))
  const hasNewFeatures = meaningfulFiles.some(
    (f) => (f.includes('app/') || f.includes('pages/')) && isNewFile(f)
  )

  if (hasNewComponents || hasNewFeatures) return 'minor'
  if (hasApiChanges) return 'minor'

  return 'patch' // default
}

/**
 * Prompt user for bump type
 * @param {string} suggestion - Suggested bump type
 * @returns {Promise<string>} User's choice
 */
function promptUser(suggestion) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    const suggestionText =
      suggestion === 'skip' ? 'skip (documentation/test changes only)' : suggestion

    rl.question(
      `\n📦 Suggested version bump: ${suggestionText}\n` +
        `   Select bump type (major/minor/patch/skip) [${suggestion}]: `,
      (answer) => {
        rl.close()
        const choice = answer.trim().toLowerCase() || suggestion
        resolve(choice)
      }
    )
  })
}

/**
 * Update version in package.json
 * @param {string} newVersion - New version to set
 */
function updatePackageJson(newVersion) {
  try {
    const content = fs.readFileSync('package.json', 'utf8')

    // Try to preserve formatting by replacing version string in place
    const versionRegex = /"version"\s*:\s*"[^"]+"/
    if (versionRegex.test(content)) {
      const updated = content.replace(versionRegex, `"version": "${newVersion}"`)
      fs.writeFileSync('package.json', updated)
    } else {
      // Fallback to JSON parse/stringify if regex fails
      const packageJson = JSON.parse(content)
      packageJson.version = newVersion
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n')
    }

    // Run prettier if available to ensure consistent formatting
    try {
      execSync('npx prettier --write package.json', { stdio: 'pipe' })
    } catch {
      // Prettier not available or failed, continue anyway
    }

    console.log(`✅ Updated package.json to version ${newVersion}`)
  } catch (err) {
    console.error('❌ Error updating package.json:', err.message)
    process.exit(1)
  }
}

/**
 * Stage package.json for commit
 */
function stagePackageJson() {
  try {
    execSync('git add package.json', { stdio: 'pipe' })
    console.log('✅ Staged package.json')
  } catch (err) {
    console.error('❌ Error staging package.json:', err.message)
    process.exit(1)
  }
}

/**
 * Main execution flow
 */
async function main() {
  console.log('\n🚀 Version Bump Script\n')

  // Check if version bumping is enabled
  if (config.enabled === false) {
    console.log('ℹ️  Version bumping is disabled in package.json config')
    process.exit(0)
  }

  // Detect automated environment and adjust config
  const isAutomated = isAutomatedEnvironment()
  if (isAutomated && config.autoSkipInCI) {
    console.log('🤖 Detected automated environment (CI/agentic workflow)')
    console.log('   Using non-interactive mode with auto-suggestions\n')
    config.interactive = false
    // Optionally skip lint in automated environments for speed
    if (!skipLint && config.lintBeforeBump) {
      console.log('⚠️  Skipping lint in automated environment (can be changed in config)\n')
      config.lintBeforeBump = false
    }
  }

  // Run lint check (unless skipped)
  if (!skipLint && config.lintBeforeBump !== false) {
    const lintPassed = runLint()
    if (!lintPassed) {
      console.error('\n❌ Version bump cancelled due to lint errors.')
      process.exit(1)
    }
    console.log('✅ Lint check passed!\n')
  } else if (skipLint) {
    console.log('⚠️  Skipping lint check\n')
  }

  // Get current version
  const currentVersion = getCurrentVersion()
  console.log(`📌 Current version: ${currentVersion}`)

  // Get staged files and analyze
  const stagedFiles = getStagedFiles()
  if (stagedFiles.length === 0) {
    console.log('ℹ️  No staged changes found')
    process.exit(0)
  }

  console.log(`📝 Analyzing ${stagedFiles.length} staged file(s)...`)

  // Determine bump type
  let bumpType
  if (forcedBumpType) {
    bumpType = forcedBumpType
    console.log(`📍 Using forced bump type: ${bumpType}`)
  } else {
    const suggestion = suggestBumpType(commitMsg || '', stagedFiles)

    if (suggestion === 'skip' && !config.interactive) {
      console.log('ℹ️  Only documentation/test changes detected, skipping version bump')
      process.exit(0)
    }

    if (config.interactive && !skipPrompt && !isAutomated) {
      bumpType = await promptUser(suggestion)
    } else {
      bumpType = suggestion
      console.log(`🤖 Auto-selected bump type: ${bumpType}`)
    }
  }

  // Handle skip
  if (bumpType === 'skip') {
    console.log('\n⏭️  Skipping version bump')
    process.exit(0)
  }

  // Validate bump type
  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error(`❌ Invalid bump type: ${bumpType}`)
    process.exit(1)
  }

  // Bump version
  const newVersion = bumpVersion(currentVersion, bumpType)
  console.log(`\n🎯 Bumping version: ${currentVersion} → ${newVersion} (${bumpType})`)

  // Update package.json
  updatePackageJson(newVersion)

  // Stage the updated package.json
  stagePackageJson()

  console.log('\n✨ Version bump complete!\n')
  process.exit(0)
}

// Run main function
main().catch((err) => {
  console.error('❌ Unexpected error:', err.message)
  process.exit(1)
})
