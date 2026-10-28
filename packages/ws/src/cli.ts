#!/usr/bin/env node
import { createSignalServer } from './server.js'

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(name)
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1]
  return fallback
}

const port = Number(arg('--port', process.env.PORT ?? '8787'))
const host = arg('--host', process.env.HOST ?? '0.0.0.0')!
const path = arg('--path', process.env.SIGNAL_PATH ?? '/signal')!
const maxPeersPerRoom = Number(
  arg('--max-peers', process.env.MAX_PEERS_PER_ROOM ?? '2'),
)

const server = createSignalServer({ port, host, path, maxPeersPerRoom })

const info = await server.listen()
console.log(`[ofc-gm/ws] signaling listening on ${info.url}`)
console.log(`[ofc-gm/ws] health: http://127.0.0.1:${info.port}/health`)
console.log(`[ofc-gm/ws] maxPeersPerRoom=${maxPeersPerRoom}`)

const shutdown = async () => {
  console.log('\n[ofc-gm/ws] shutting down…')
  await server.close()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())
