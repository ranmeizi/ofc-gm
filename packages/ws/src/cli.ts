#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSignalServer } from './server.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function pkgVersion(): string {
  try {
    const raw = readFileSync(join(__dirname, '../package.json'), 'utf8')
    return (JSON.parse(raw) as { version?: string }).version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(name)
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1]
  return fallback
}

function hasFlag(name: string) {
  return process.argv.includes(name)
}

function printHelp() {
  const v = pkgVersion()
  console.log(`@ofc-gm/ws v${v}

WebSocket signaling relay for OFC-GM (SDP exchange, 2-peer rooms).

Usage:
  ofc-signal-ws [options]
  ofc-gm-ws [options]

Options:
  --port <n>         listen port (env PORT, default 8787)
  --host <addr>      bind address (env HOST, default 0.0.0.0)
  --path <path>      websocket path (env SIGNAL_PATH, default /signal)
  --max-peers <n>    max peers per room (env MAX_PEERS_PER_ROOM, default 2)
  -h, --help         show help
  -v, --version      show version

PM2:
  pm2 start ecosystem.config.cjs
  # or after global install:
  pm2 start ofc-signal-ws --name ofc-signal-ws -- --port 8787

Health:
  GET http://127.0.0.1:<port>/health
`)
}

if (hasFlag('-h') || hasFlag('--help')) {
  printHelp()
  process.exit(0)
}

if (hasFlag('-v') || hasFlag('--version')) {
  console.log(pkgVersion())
  process.exit(0)
}

const port = Number(arg('--port', process.env.PORT ?? '8787'))
const host = arg('--host', process.env.HOST ?? '0.0.0.0')!
const path = arg('--path', process.env.SIGNAL_PATH ?? '/signal')!
const maxPeersPerRoom = Number(
  arg('--max-peers', process.env.MAX_PEERS_PER_ROOM ?? '2'),
)

if (!Number.isFinite(port) || port <= 0) {
  console.error('[ofc-gm/ws] invalid --port')
  process.exit(1)
}

const server = createSignalServer({ port, host, path, maxPeersPerRoom })

const info = await server.listen()
console.log(`[ofc-gm/ws] v${pkgVersion()} signaling listening on ${info.url}`)
console.log(`[ofc-gm/ws] health: http://127.0.0.1:${info.port}/health`)
console.log(`[ofc-gm/ws] maxPeersPerRoom=${maxPeersPerRoom}`)

let closing = false
const shutdown = async (signal: string) => {
  if (closing) return
  closing = true
  console.log(`\n[ofc-gm/ws] ${signal} — shutting down…`)
  try {
    await server.close()
  } catch (e) {
    console.error('[ofc-gm/ws] close error:', e)
  }
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
