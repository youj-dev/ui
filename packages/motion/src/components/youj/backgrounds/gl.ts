/* Shared plumbing for the canvas / WebGL2 backgrounds. The pieces import from here; the work lives in:
 *  - render-loop: sizing, the rAF clock, offscreen / hidden-tab pausing, the reduced-motion frame.
 *  - webgl: program compile, the full-screen shader renderer, context loss + restore.
 *  - resolve-colors: token colors read from computed CSS, theme observation, the CSS fallback.
 *  - use-background-canvas: the React hooks that tie them together. */

export type { Rgb } from './color'
export { createRenderLoop, type FrameSize, type LoopSettings, type RenderLoop, type RenderLoopOptions } from './render-loop'
export { compileProgram, createShaderRenderer, type ShaderRenderer, type Uniforms } from './webgl'
export { fallbackBackground, observeTheme, resolveColors } from './resolve-colors'
export {
  useBackgroundCanvas,
  useShaderBackground,
  type BackgroundCanvasOptions,
  type CanvasRenderer,
  type FrameInfo,
  type PointerState,
  type ShaderBackgroundOptions,
} from './use-background-canvas'
