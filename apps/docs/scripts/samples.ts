// Copies @youj/motion's Lottie sample files into public/samples so docs
// examples can load them at /samples/*. The package folder stays the single
// source of truth (the Lottie samples are generated there).
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { docsRoot, packagesDir, report } from './lib.ts'

const from = `${packagesDir}/motion/public/samples`
const to = `${docsRoot}public/samples`

rmSync(to, { recursive: true, force: true })
mkdirSync(to, { recursive: true })
cpSync(from, to, { recursive: true })
report('samples', 'copied to public/samples')
