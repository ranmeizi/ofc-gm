/**
 * PM2 ecosystem for @ofc-gm/ws
 *
 * Local monorepo:
 *   cd packages/ws && pm2 start ecosystem.config.cjs
 *
 * After npm install / global:
 *   pm2 start ./node_modules/@ofc-gm/ws/ecosystem.config.cjs
 *   # or
 *   pm2 start ofc-signal-ws --name ofc-signal-ws -- --port 8787
 */
const { join } = require('node:path')

module.exports = {
  apps: [
    {
      name: 'ofc-signal-ws',
      script: join(__dirname, 'dist/cli.js'),
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 8787,
        HOST: '0.0.0.0',
        SIGNAL_PATH: '/signal',
        MAX_PEERS_PER_ROOM: 2,
      },
    },
  ],
}
