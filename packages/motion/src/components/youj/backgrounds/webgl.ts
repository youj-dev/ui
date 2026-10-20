/* WebGL2 program on a full-screen triangle: readable compile errors, context loss + restore. */

import type { FrameSize } from './render-loop'
import { FRAGMENT_PRELUDE, FULLSCREEN_VERTEX } from './common.glsl'


/** Compiles and links a program. Throws with the driver log and the offending source lines. */
export function compileProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string): WebGLProgram {
  const compile = (type: number, source: string, label: string) => {
    const shader = gl.createShader(type)
    if (!shader) throw new Error(`youj/gl: could not create ${label} shader`)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
      const log = gl.getShaderInfoLog(shader) ?? ''
      gl.deleteShader(shader)
      throw new Error(`youj/gl: ${label} shader failed to compile\n${log}\n${excerpt(source, log)}`)
    }
    return shader
  }
  const vs = compile(gl.VERTEX_SHADER, vertex, 'vertex')
  const fs = compile(gl.FRAGMENT_SHADER, fragment, 'fragment')
  const program = gl.createProgram()
  if (!program) throw new Error('youj/gl: could not create program')
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    const log = gl.getProgramInfoLog(program) ?? ''
    gl.deleteProgram(program)
    throw new Error(`youj/gl: program failed to link\n${log}`)
  }
  return program
}

// "ERROR: 0:42: …" → show lines 40–44 of the source with line numbers, error line marked.
function excerpt(source: string, log: string): string {
  const lines = source.split('\n')
  const marked = new Set([...log.matchAll(/ERROR:\s*\d+:(\d+)/g)].map((m) => Number(m[1])))
  const out: string[] = []
  for (const n of marked) {
    for (let i = Math.max(1, n - 2); i <= Math.min(lines.length, n + 2); i++) {
      out.push(`${i === n ? '>' : ' '} ${String(i).padStart(4)} | ${lines[i - 1]}`)
    }
    out.push('')
  }
  return out.join('\n')
}

export interface Uniforms {
  float(name: string, x: number): void
  vec2(name: string, x: number, y: number): void
  vec3(name: string, v: ArrayLike<number>): void
  vec4(name: string, v: ArrayLike<number>): void
  vec3Array(name: string, v: Float32Array): void
  vec4Array(name: string, v: Float32Array): void
}

export interface ShaderRenderer {
  uniforms: Uniforms
  /** Binds program + viewport. False while the context is lost. */
  begin(size: FrameSize): boolean
  draw(): void
  dispose(): void
}

/** Returns null when WebGL2 is unavailable or the shader fails (the error is logged). */
export function createShaderRenderer(
  canvas: HTMLCanvasElement,
  fragmentBody: string,
  onRestored: () => void,
): ShaderRenderer | null {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  })
  if (!gl) return null

  let program: WebGLProgram | null = null
  let vao: WebGLVertexArrayObject | null = null
  let lost = false
  const locations = new Map<string, WebGLUniformLocation | null>()

  const build = () => {
    program = compileProgram(gl, FULLSCREEN_VERTEX, FRAGMENT_PRELUDE + fragmentBody)
    vao = gl.createVertexArray()
    locations.clear()
  }
  try {
    build()
  } catch (error) {
    console.error(error)
    return null
  }

  const onLost = (event: Event) => {
    event.preventDefault()
    lost = true
  }
  const onRestore = () => {
    try {
      build()
      lost = false
      onRestored()
    } catch (error) {
      console.error(error)
    }
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestore)

  const loc = (name: string) => {
    let l = locations.get(name)
    if (l === undefined && program) {
      l = gl.getUniformLocation(program, name)
      locations.set(name, l)
    }
    return l ?? null
  }

  return {
    uniforms: {
      float: (name, x) => gl.uniform1f(loc(name), x),
      vec2: (name, x, y) => gl.uniform2f(loc(name), x, y),
      vec3: (name, v) => gl.uniform3f(loc(name), v[0] ?? 0, v[1] ?? 0, v[2] ?? 0),
      vec4: (name, v) => gl.uniform4f(loc(name), v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 0),
      vec3Array: (name, v) => gl.uniform3fv(loc(name), v),
      vec4Array: (name, v) => gl.uniform4fv(loc(name), v),
    },
    begin: (size) => {
      if (lost || !program) return false
      gl.viewport(0, 0, size.width, size.height)
      // biome-ignore lint/correctness/useHookAtTopLevel: WebGLRenderingContext.useProgram, not a React hook
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      return true
    },
    draw: () => gl.drawArrays(gl.TRIANGLES, 0, 3),
    dispose: () => {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestore)
      if (!lost) {
        gl.deleteVertexArray(vao)
        gl.deleteProgram(program)
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
