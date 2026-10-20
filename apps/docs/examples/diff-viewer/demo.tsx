'use client'

import { DiffViewer } from '@youj/react'

const BEFORE = `name: deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
`

const AFTER = `name: deploy
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test -- --coverage
`

export default function DiffViewerDemo() {
  return (
    <div className="w-full max-w-2xl">
      <DiffViewer before={BEFORE} after={AFTER} filename=".github/workflows/deploy.yml" language="yaml" />
    </div>
  )
}
