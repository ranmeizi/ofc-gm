#!/usr/bin/env node
/**
 * 从本机 NesEmulatorWeb 拷贝 MAME.min.js，并合并 kof97 + neogeo BIOS → kof97.zip
 * （体积大 / 版权 ROM，默认 gitignore，仅本地 demo）
 *
 * 用法：node packages/homepage/scripts/copy-mame.mjs
 */
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '../public/examples/mame-kof')
const watchRoot = resolve(here, '../../../../../../watch/NesEmulatorWeb')

const mameSrc =
  process.argv[2] || resolve(watchRoot, 'sources/MAME/MAME.min.js')
const kofSrc = resolve(watchRoot, 'roms/kof97.zip')
const biosSrc = resolve(watchRoot, 'roms/neogeo.zip')
const mameDest = join(outDir, 'MAME.min.js')
const romDest = join(outDir, 'kof97.zip')

mkdirSync(outDir, { recursive: true })

if (!existsSync(mameSrc)) {
  console.error('找不到 MAME.min.js:', mameSrc)
  process.exit(1)
}
copyFileSync(mameSrc, mameDest)
console.log('copied →', mameDest)

if (!existsSync(kofSrc) || !existsSync(biosSrc)) {
  console.error('找不到 ROM:', kofSrc, '或', biosSrc)
  console.error('请把 kof97.zip / neogeo.zip 放到 NesEmulatorWeb/roms/')
  process.exit(1)
}

const work = mkdtempSync(join(tmpdir(), 'ofc-mame-rom-'))
try {
  execFileSync('unzip', ['-o', '-q', kofSrc, '-d', work])
  execFileSync('unzip', ['-o', '-q', biosSrc, '-d', work])
  // -j 不要；保留扁平文件名。-FS 覆盖目标
  execFileSync('zip', ['-q', '-r', '-FS', romDest, '.'], { cwd: work })
  console.log('merged kof97+neogeo →', romDest)
} finally {
  rmSync(work, { recursive: true, force: true })
}
