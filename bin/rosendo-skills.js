#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const RAW_BASE_URL = 'https://raw.githubusercontent.com/rosendolu/cursor-skills/main'
const GH_API_BASE_URL = 'https://api.github.com/repos/rosendolu/cursor-skills'

const TEMPLATE_PREFIX_DIRS = ['.cursor/', '.vscode/', 'docs/']
const TEMPLATE_TOP_LEVEL_FILES = ['.gitignore', '.prettierignore', '.prettierrc']

function printHelp() {
  process.stdout.write(
    [
      'rosendo-skills',
      '',
      'Usage:',
      '  npx rosendo-skills init [targetDir]',
      '',
      'Commands:',
      '  init   Fetch template files from rosendolu/cursor-skills and initialize OpenSpec',
      ''
    ].join('\n') + '\n'
  )
}

async function ensureDirectoryExists(dirPath) {
  await mkdir(dirPath, { recursive: true })
}

async function assertDirectoryExists(dirPath) {
  let s
  try {
    s = await stat(dirPath)
  } catch {
    throw new Error(`Target directory does not exist: ${dirPath}`)
  }
  if (!s.isDirectory()) {
    throw new Error(`Target path is not a directory: ${dirPath}`)
  }
}

async function runCommand(command, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'rosendo-skills'
    }
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} (${res.status} ${res.statusText})`)
  }
  return await res.text()
}

function isTemplatePath(repoPath) {
  if (TEMPLATE_TOP_LEVEL_FILES.includes(repoPath)) return true
  return TEMPLATE_PREFIX_DIRS.some((prefix) => repoPath.startsWith(prefix))
}

async function fetchRepoTreePaths() {
  const url = `${GH_API_BASE_URL}/git/trees/main?recursive=1`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'rosendo-skills'
    }
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch repo tree (${res.status} ${res.statusText})`)
  }

  const data = await res.json()
  const tree = Array.isArray(data?.tree) ? data.tree : []

  // Keep only files (blobs) that belong to our curated templates.
  const paths = tree
    .filter((item) => item?.type === 'blob' && typeof item?.path === 'string')
    .map((item) => item.path)
    .filter((repoPath) => isTemplatePath(repoPath))

  // Keep output stable/deterministic.
  paths.sort()
  return paths
}

async function writeRemoteFile(targetRoot, repoPath) {
  const url = `${RAW_BASE_URL}/${repoPath}`
  const destinationPath = path.join(targetRoot, repoPath)
  const content = await fetchText(url)
  await ensureDirectoryExists(path.dirname(destinationPath))
  await writeFile(destinationPath, content, 'utf8')
  return destinationPath
}

async function initCommand(targetDirArg) {
  const targetRoot = path.resolve(targetDirArg ?? process.cwd())
  await assertDirectoryExists(targetRoot)

  process.stdout.write(`Target: ${targetRoot}\n`)
  process.stdout.write(`Fetching from: ${RAW_BASE_URL}\n`)
  process.stdout.write('Fetching template file list...\n')
  const templatePaths = await fetchRepoTreePaths()

  process.stdout.write(`Writing ${templatePaths.length} files:\n`)
  const writtenPaths = []

  for (const repoPath of templatePaths) {
    const writtenPath = await writeRemoteFile(targetRoot, repoPath)
    writtenPaths.push(writtenPath)
    process.stdout.write(`- ${repoPath}\n`)
  }

  process.stdout.write('\nInitializing OpenSpec:\n')
  await runCommand('npm', ['install', '-g', '@fission-ai/openspec@latest'], targetRoot)
  await runCommand('openspec', ['init', '--force', '--tools', 'cursor'], targetRoot)
}

async function main() {
  const [, , command, ...rest] = process.argv

  if (!command || command === '-h' || command === '--help') {
    printHelp()
    return
  }

  if (command !== 'init') {
    process.stderr.write(`Unknown command: ${command}\n\n`)
    printHelp()
    process.exitCode = 1
    return
  }

  const [targetDir] = rest
  await initCommand(targetDir)
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
  process.exitCode = 1
})

