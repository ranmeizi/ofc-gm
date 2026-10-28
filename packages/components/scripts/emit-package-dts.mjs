import { writeFile } from 'node:fs/promises'

await writeFile('index.d.ts', `export * from './lib/index.js';\n`)
await writeFile('react.d.ts', `export * from './lib/react/index.js';\n`)
