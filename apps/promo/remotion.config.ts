import path from 'node:path'
import { Config } from '@remotion/cli/config'

/* Rendered from the workspace sources, like apps/docs: @youj/motion,
 * @youj/react, @youj/icons and @youj/illustrations resolve to
 * packages/<dir>/src. Tailwind v4 compiles the one
 * CSS root (src/styles/promo.css) with the same version the packages use. */

const promoRoot = process.cwd()
const packages = path.resolve(promoRoot, '../../packages')
const tailwindEntry = path.resolve(promoRoot, 'src/styles/promo.css')

Config.overrideWebpackConfig((config) => {
  // Every other stylesheet (the fonts) keeps Remotion's plain CSS rule.
  const rules = (config.module?.rules ?? []).map((rule) => {
    if (!rule || typeof rule !== 'object' || !(rule.test instanceof RegExp) || !rule.test.test('x.css')) return rule
    return { ...rule, exclude: tailwindEntry }
  })
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias as Record<string, string>),
        '@youj/core': path.join(packages, 'core/src'),
        '@youj/motion': path.join(packages, 'motion/src'),
        '@youj/react': path.join(packages, 'ui/src'),
        '@youj/icons': path.join(packages, 'icons/src'),
        '@youj/illustrations': path.join(packages, 'illustrations/src'),
      },
    },
    module: {
      ...config.module,
      rules: [
        ...rules,
        {
          test: tailwindEntry,
          use: ['style-loader', 'css-loader', { loader: '@tailwindcss/webpack', options: { base: promoRoot } }],
          type: 'javascript/auto',
        },
      ],
    },
  }
})

Config.setEntryPoint('src/index.ts')
// Frames stay lossless until the encoder: text edges survive the H.264 pass.
Config.setVideoImageFormat('png')
Config.setStillImageFormat('png')
Config.setPixelFormat('yuv420p')
Config.setCodec('h264')
Config.setTimeoutInMilliseconds(10 * 60 * 1000)
Config.setChromiumOpenGlRenderer('angle')
