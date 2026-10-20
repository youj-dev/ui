/* A fake `figma` global for running the plugin headlessly. It keeps a real
 * node tree (so a second run can be checked for duplicates, and the preview
 * can draw it) and enforces the rules that make real plugins fail at
 * runtime: fonts loaded before text edits, HUG only on auto layout, FILL only
 * inside auto layout, the dynamic-page async APIs, plan limits on modes and
 * pages, strict paint and effect shapes, and Figma's variable naming rules.
 * It covers the API surface the kit uses, not all of Figma. */

import { bounds, parsePath } from '../src/data/geometry'

export interface FakeOptions {
  /** Modes per collection: Starter 1, Professional 10. Default 10. */
  modeLimit?: number
  /** Pages per file: a Starter team file allows 3. Default unlimited. */
  pageLimit?: number
  command?: string
  fonts?: FontName[]
  /** Fonts listed by listAvailableFontsAsync that fail to load (a local font whose file went missing). */
  unloadable?: FontName[]
  /** Makes an API throw with this message, to check the build carries on past it. */
  failures?: Partial<Record<FailPoint, string>>
}

export type FailPoint = 'createImage' | 'createNodeFromSvg' | 'setVariableCodeSyntax' | 'addMode' | 'createPage' | 'showUI' | 'combineAsVariants'

type Json = Record<string, unknown>

export const DEFAULT_FONTS: FontName[] = [
  // Geist (the display fallback and Bezel's face) and Basalt's Inter and JetBrains Mono, which Figma ships as Google Fonts.
  ...['Thin', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'Black'].map((style) => ({ family: 'Geist', style })),
  ...['Thin', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'Black'].map((style) => ({ family: 'Geist Mono', style })),
  ...['Thin', 'Light', 'Regular', 'Italic', 'Medium', 'Semi Bold', 'Bold', 'Extra Bold', 'Black'].map((style) => ({ family: 'Inter', style })),
  ...['Regular', 'Italic', 'Medium', 'SemiBold', 'Bold'].map((style) => ({ family: 'JetBrains Mono', style })),
  ...['Regular', 'Medium', 'Bold'].map((style) => ({ family: 'Roboto', style })),
  // The brand face, installed from packages/brand-font: one weight.
  { family: 'Youj Display', style: 'Regular' },
]

let nextId = 1
const newId = (prefix = '1') => `${prefix}:${nextId++}`

function fail(message: string): never {
  throw new Error(message)
}

const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const within01 = (v: unknown) => isNum(v) && (v as number) >= 0 && (v as number) <= 1

function checkKeys(obj: Json, allowed: string[], what: string) {
  for (const k of Object.keys(obj)) if (!allowed.includes(k)) fail(`${what}: unrecognized key "${k}"`)
}

function checkPaint(p: Json) {
  if (p.type === 'SOLID') {
    checkKeys(p, ['type', 'color', 'opacity', 'visible', 'blendMode', 'boundVariables'], 'SolidPaint')
    const c = p.color as Json
    if (!c) fail('SolidPaint: color is required')
    checkKeys(c, ['r', 'g', 'b'], 'SolidPaint.color (RGB, no alpha)')
    if (!within01(c.r) || !within01(c.g) || !within01(c.b)) fail('SolidPaint.color channels must be 0–1')
    if (p.opacity !== undefined && !within01(p.opacity)) fail('SolidPaint.opacity must be 0–1')
    return
  }
  if (p.type === 'IMAGE') {
    checkKeys(p, ['type', 'imageHash', 'scaleMode', 'opacity', 'visible', 'blendMode', 'imageTransform', 'scalingFactor', 'rotation', 'filters'], 'ImagePaint')
    if (typeof p.imageHash !== 'string') fail('ImagePaint: imageHash is required')
    if (!['FILL', 'FIT', 'CROP', 'TILE'].includes(p.scaleMode as string)) fail('ImagePaint: bad scaleMode')
    return
  }
  fail(`Paint type ${String(p.type)} is not used by the kit`)
}

function checkEffect(e: Json) {
  if (e.type !== 'DROP_SHADOW' && e.type !== 'INNER_SHADOW') fail(`Effect type ${String(e.type)} is not used by the kit`)
  checkKeys(e, ['type', 'color', 'offset', 'radius', 'spread', 'visible', 'blendMode', 'showShadowBehindNode', 'boundVariables'], 'ShadowEffect')
  for (const k of ['color', 'offset', 'radius', 'visible', 'blendMode']) if (e[k] === undefined) fail(`ShadowEffect: ${k} is required`)
  const c = e.color as Json
  checkKeys(c, ['r', 'g', 'b', 'a'], 'ShadowEffect.color')
  if (!within01(c.a)) fail('ShadowEffect.color needs alpha')
  if (e.type === 'INNER_SHADOW' && e.showShadowBehindNode !== undefined) fail('INNER_SHADOW has no showShadowBehindNode')
}

/* ── Variables ─────────────────────────────────────────────────────────── */

const BAD_NAME = /[.${}]/

export class FakeCollection {
  id = newId('VariableCollectionId')
  key = `key${nextId}`
  remote = false
  isExtension = false
  hiddenFromPublishing = false
  modes: { modeId: string; name: string }[]
  private data = new Map<string, string>()
  removed = false
  constructor(
    private env: FakeEnv,
    public name: string,
  ) {
    this.modes = [{ modeId: newId('Mode'), name: 'Mode 1' }]
  }
  get defaultModeId() {
    return this.modes[0]!.modeId
  }
  get variableIds() {
    return this.env.variables.filter((v) => v.variableCollectionId === this.id).map((v) => v.id)
  }
  getPluginData(k: string) {
    return this.data.get(k) ?? ''
  }
  setPluginData(k: string, v: string) {
    this.data.set(k, v)
  }
  addMode(name: string) {
    if (this.modes.length >= this.env.opts.modeLimit) fail(this.env.opts.failures.addMode ?? `in addMode: Limited to ${this.env.opts.modeLimit} modes only`)
    const modeId = newId('Mode')
    this.modes.push({ modeId, name })
    for (const v of this.env.variables) if (v.variableCollectionId === this.id) v.valuesByMode[modeId] = v.valuesByMode[this.defaultModeId]!
    return modeId
  }
  removeMode(modeId: string) {
    if (this.modes.length === 1) fail('in removeMode: cannot remove the only mode')
    if (!this.modes.some((m) => m.modeId === modeId)) fail('in removeMode: no such mode')
    this.modes = this.modes.filter((m) => m.modeId !== modeId)
    for (const v of this.env.variables) delete v.valuesByMode[modeId]
  }
  renameMode(modeId: string, name: string) {
    const m = this.modes.find((x) => x.modeId === modeId) ?? fail('in renameMode: no such mode')
    m.name = name
  }
  remove() {
    this.removed = true
    this.env.collections = this.env.collections.filter((c) => c !== this)
    for (const v of [...this.env.variables]) if (v.variableCollectionId === this.id) v.remove()
  }
  getPublishStatusAsync() {
    return Promise.resolve('UNPUBLISHED')
  }
}

const SCOPES: Record<string, string[]> = {
  COLOR: ['ALL_SCOPES', 'ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR', 'EFFECT_COLOR'],
  FLOAT: ['ALL_SCOPES', 'TEXT_CONTENT', 'CORNER_RADIUS', 'WIDTH_HEIGHT', 'GAP', 'STROKE_FLOAT', 'EFFECT_FLOAT', 'OPACITY', 'FONT_WEIGHT', 'FONT_SIZE', 'LINE_HEIGHT', 'LETTER_SPACING', 'PARAGRAPH_SPACING', 'PARAGRAPH_INDENT'],
  STRING: ['ALL_SCOPES', 'TEXT_CONTENT', 'FONT_FAMILY', 'FONT_STYLE'],
  BOOLEAN: ['ALL_SCOPES'],
}

export class FakeVariable {
  id = newId('VariableID')
  key = `vkey${nextId}`
  remote = false
  description = ''
  hiddenFromPublishing = false
  valuesByMode: Record<string, unknown> = {}
  codeSyntax: Record<string, string> = {}
  private _scopes: string[] = ['ALL_SCOPES']
  private _name: string
  private data = new Map<string, string>()
  removed = false
  constructor(
    private env: FakeEnv,
    name: string,
    public variableCollectionId: string,
    public resolvedType: string,
  ) {
    this._name = ''
    this.name = name
  }
  get name() {
    return this._name
  }
  set name(n: string) {
    if (!n || BAD_NAME.test(n) || n.startsWith('/') || n.endsWith('/') || n.includes('//')) fail(`Invalid variable name "${n}"`)
    if (this.env.variables.some((v) => v !== this && v.variableCollectionId === this.variableCollectionId && v.name === n)) fail(`Variable name "${n}" already exists in this collection`)
    this._name = n
  }
  get scopes() {
    return this._scopes
  }
  set scopes(s: string[]) {
    for (const x of s) if (!SCOPES[this.resolvedType]!.includes(x)) fail(`Invalid scope ${x} for a ${this.resolvedType} variable`)
    if (s.includes('ALL_SCOPES') && s.length > 1) fail('ALL_SCOPES cannot be combined with other scopes')
    if (s.includes('ALL_FILLS') && s.some((x) => ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'].includes(x))) fail('ALL_FILLS cannot be combined with other fill scopes')
    this._scopes = [...s]
  }
  getPluginData(k: string) {
    return this.data.get(k) ?? ''
  }
  setPluginData(k: string, v: string) {
    this.data.set(k, v)
  }
  setValueForMode(modeId: string, value: unknown) {
    const c = this.env.collections.find((x) => x.id === this.variableCollectionId) ?? fail('variable has no collection')
    if (!c.modes.some((m) => m.modeId === modeId)) fail(`in setValueForMode: mode ${modeId} is not in ${c.name}`)
    const v = value as Json
    if (v && typeof v === 'object' && v.type === 'VARIABLE_ALIAS') {
      const target = this.env.variables.find((x) => x.id === v.id) ?? fail('alias to a missing variable')
      if (target.resolvedType !== this.resolvedType) fail(`alias type mismatch: ${this.resolvedType} → ${target.resolvedType}`)
      if (target === this) fail('a variable cannot alias itself')
      this.valuesByMode[modeId] = { type: 'VARIABLE_ALIAS', id: v.id }
      this.env.checkCycles(this)
      return
    }
    switch (this.resolvedType) {
      case 'COLOR':
        if (!v || !within01(v.r) || !within01(v.g) || !within01(v.b) || (v.a !== undefined && !within01(v.a))) fail(`bad COLOR value ${JSON.stringify(value)}`)
        break
      case 'FLOAT':
        if (!isNum(value)) fail(`bad FLOAT value ${JSON.stringify(value)}`)
        break
      case 'STRING':
        if (typeof value !== 'string') fail('bad STRING value')
        break
      case 'BOOLEAN':
        if (typeof value !== 'boolean') fail('bad BOOLEAN value')
        break
    }
    this.valuesByMode[modeId] = value
  }
  setVariableCodeSyntax(platform: string, value: string) {
    this.env.maybeFail('setVariableCodeSyntax')
    if (!['WEB', 'ANDROID', 'iOS'].includes(platform)) fail('bad platform')
    this.codeSyntax[platform] = value
  }
  removeVariableCodeSyntax(platform: string) {
    delete this.codeSyntax[platform]
  }
  remove() {
    this.removed = true
    this.env.variables = this.env.variables.filter((v) => v !== this)
  }
}

/* ── Styles ────────────────────────────────────────────────────────────── */

class FakeStyle {
  id: string
  name = ''
  description = ''
  removed = false
  remote = false
  boundVariables: Record<string, unknown> = {}
  private data = new Map<string, string>()
  constructor(
    protected env: FakeEnv,
    public type: 'TEXT' | 'EFFECT',
  ) {
    this.id = `S:${newId('style')}`
  }
  getPluginData(k: string) {
    return this.data.get(k) ?? ''
  }
  setPluginData(k: string, v: string) {
    this.data.set(k, v)
  }
  remove() {
    this.removed = true
    this.env.styles = this.env.styles.filter((s) => s !== this)
  }
}

export class FakeTextStyle extends FakeStyle {
  private _font: FontName = { family: 'Inter', style: 'Regular' }
  fontSize = 12
  lineHeight: unknown = { unit: 'AUTO' }
  letterSpacing: unknown = { unit: 'PERCENT', value: 0 }
  textCase = 'ORIGINAL'
  constructor(env: FakeEnv) {
    super(env, 'TEXT')
  }
  get fontName() {
    return this._font
  }
  set fontName(f: FontName) {
    this.env.requireFont(f, 'TextStyle.fontName')
    this._font = { ...f }
  }
  setBoundVariable(field: string, variable: FakeVariable | null) {
    if (!['fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'lineHeight', 'paragraphSpacing', 'paragraphIndent'].includes(field)) fail(`TextStyle cannot bind ${field}`)
    if (variable && (field === 'fontFamily' || field === 'fontStyle' ? variable.resolvedType !== 'STRING' : variable.resolvedType !== 'FLOAT')) fail(`TextStyle.${field} needs a different variable type`)
    if (variable) this.boundVariables[field] = { type: 'VARIABLE_ALIAS', id: variable.id }
    else delete this.boundVariables[field]
  }
}

export class FakeEffectStyle extends FakeStyle {
  private _effects: Json[] = []
  constructor(env: FakeEnv) {
    super(env, 'EFFECT')
  }
  get effects() {
    return this._effects
  }
  set effects(list: Json[]) {
    list.forEach(checkEffect)
    this._effects = list.map((e) => structuredClone(e))
  }
}

/* ── Nodes ─────────────────────────────────────────────────────────────── */

const CONTAINERS = new Set(['DOCUMENT', 'PAGE', 'FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'GROUP', 'SECTION'])
const AUTO_LAYOUT = new Set(['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'])
// VariableBindableNodeField in @figma/plugin-typings: no cornerRadius (bind the four corners).
const BINDABLE = [
  'height', 'width', 'characters', 'itemSpacing', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'visible',
  'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'counterAxisSpacing', 'strokeWeight', 'strokeTopWeight', 'strokeRightWeight', 'strokeBottomWeight', 'strokeLeftWeight', 'opacity',
  'gridRowGap', 'gridColumnGap',
]

export class FakeNode {
  id = newId()
  name = ''
  parent: FakeNode | null = null
  removed = false
  private data = new Map<string, string>()
  relaunch: Record<string, string> = {}
  private _children: FakeNode[] = []
  loaded = true

  x = 0
  y = 0
  private _w = 100
  private _h = 100
  visible = true
  locked = false
  private _opacity = 1
  private _fills: Json[] = []
  private _strokes: Json[] = []
  strokeWeight = 1
  strokeTopWeight = 1
  strokeRightWeight = 1
  strokeBottomWeight = 1
  strokeLeftWeight = 1
  strokeAlign = 'INSIDE'
  strokeCap = 'NONE'
  strokeJoin = 'MITER'
  dashPattern: number[] = []
  cornerRadius = 0
  topLeftRadius = 0
  topRightRadius = 0
  bottomLeftRadius = 0
  bottomRightRadius = 0
  private _effects: Json[] = []
  effectStyleIdValue = ''
  isMask = false
  maskType = 'ALPHA'
  clipsContent = false
  constraints = { horizontal: 'MIN', vertical: 'MIN' }
  rotation = 0
  blendMode = 'PASS_THROUGH'
  backgrounds: Json[] = []

  private _layoutMode = 'NONE'
  itemSpacing = 0
  counterAxisSpacing = 0
  paddingLeft = 0
  paddingRight = 0
  paddingTop = 0
  paddingBottom = 0
  primaryAxisAlignItems = 'MIN'
  private _counterAlign = 'MIN'
  private _layoutWrap = 'NO_WRAP'
  primaryAxisSizingMode = 'FIXED'
  counterAxisSizingMode = 'FIXED'
  sizingH = 'FIXED'
  sizingV = 'FIXED'
  private _layoutPositioning = 'AUTO'
  strokesIncludedInLayout = false
  itemReverseZIndex = false
  layoutGrow = 0
  layoutAlign = 'INHERIT'

  private _characters = ''
  private _font: FontName = { family: 'Inter', style: 'Regular' }
  private _fontSize = 12
  private _lineHeight: unknown = { unit: 'AUTO' }
  private _letterSpacing: unknown = { unit: 'PERCENT', value: 0 }
  private _textCase = 'ORIGINAL'
  textAlignHorizontal = 'LEFT'
  textAlignVertical = 'TOP'
  private _textAutoResize = 'NONE'
  private _textTruncation = 'DISABLED'
  private _maxLines: number | null = null
  textStyleIdValue = ''

  svgPath?: string
  /** Where the path's own coordinates put the vector when it was imported. */
  svgOrigin?: { x: number; y: number }
  /** The imported path's fill rule: Figma keeps even-odd as the vector's winding rule. */
  windingRule: 'NONZERO' | 'EVENODD' = 'NONZERO'
  description = ''
  key = `ckey${nextId}`
  properties: Record<string, { type: string; defaultValue: unknown; variantOptions?: string[]; preferredValues?: unknown[] }> = {}
  private _refs: Record<string, string> | null = null
  mainComponentId?: string
  instanceProps: Record<string, unknown> = {}
  boundVariables: Record<string, unknown> = {}
  explicitVariableModes: Record<string, string> = {}
  imageHash?: string

  constructor(
    public env: FakeEnv,
    public type: string,
  ) {}

  private live() {
    if (this.removed) fail(`The node (${this.type} "${this.name}") has been removed`)
  }

  getPluginData(k: string) {
    return this.data.get(k) ?? ''
  }
  setPluginData(k: string, v: string) {
    if (typeof v !== 'string') fail('setPluginData: value must be a string')
    this.data.set(k, v)
  }
  setRelaunchData(d: Record<string, string>) {
    this.relaunch = { ...d }
  }

  private exposed = false
  get isExposedInstance() {
    return this.exposed
  }
  // Figma checks where the instance sits at the moment it's exposed, so expose it only once it's inside its component.
  set isExposedInstance(value: boolean) {
    if (value) {
      let inComponent = false
      for (let a = this.parent; a; a = a.parent) if (a.type === 'COMPONENT' || a.type === 'COMPONENT_SET') inComponent = true
      if (!inComponent) fail('in set_isExposedInstance: Instance must be contained within a component or component set to be exposed.')
    }
    this.exposed = value
  }

  /* children */
  get children(): FakeNode[] {
    if (!CONTAINERS.has(this.type)) return undefined as never
    if (this.type === 'PAGE' && !this.loaded) fail('Cannot access children on a page that has not been explicitly loaded. Call PageNode.loadAsync first.')
    return [...this._children]
  }
  rawChildren() {
    return this._children
  }
  async loadAsync() {
    this.loaded = true
  }
  private canHold(child: FakeNode) {
    if (!CONTAINERS.has(this.type)) fail(`${this.type} cannot have children`)
    if (this.type === 'DOCUMENT') {
      if (child.type !== 'PAGE') fail('Only pages can be children of the document')
      return
    }
    if (child.type === 'PAGE' || child.type === 'DOCUMENT') fail('Cannot move a page into a node')
    if (this.type === 'INSTANCE') fail('Cannot add children to an instance')
    if (this.type === 'COMPONENT_SET' && child.type !== 'COMPONENT') fail('A component set can only contain components')
    for (let a: FakeNode | null = this; a; a = a.parent) if (a === child) fail('Cannot move a node into itself')
    if (child.type === 'COMPONENT' || child.type === 'COMPONENT_SET') {
      for (let a: FakeNode | null = this; a; a = a.parent) {
        if (a.type === 'COMPONENT' || a.type === 'INSTANCE' || (a.type === 'COMPONENT_SET' && a !== this)) fail('Cannot move a component inside another component')
      }
    }
    if (this.type === 'PAGE' && !this.loaded) fail('Page not loaded')
  }
  appendChild(child: FakeNode) {
    this.live()
    this.insertChild(this._children.length, child)
  }
  insertChild(index: number, child: FakeNode) {
    this.live()
    this.canHold(child)
    if (child.parent) child.parent._children = child.parent._children.filter((c) => c !== child)
    this._children.splice(Math.min(index, this._children.length), 0, child)
    child.parent = this
    // Fill sizing can't survive a parent without auto layout.
    if ((child.sizingH === 'FILL' || child.sizingV === 'FILL') && this._layoutMode === 'NONE') {
      if (child.sizingH === 'FILL') child.sizingH = 'FIXED'
      if (child.sizingV === 'FILL') child.sizingV = 'FIXED'
    }
  }
  remove() {
    this.live()
    if (this.parent) this.parent._children = this.parent._children.filter((c) => c !== this)
    this.parent = null
    const mark = (n: FakeNode) => {
      n.removed = true
      n._children.forEach(mark)
    }
    mark(this)
    if (this.type === 'PAGE') this.env.pages = this.env.pages.filter((p) => p !== this)
  }
  /** Like Figma's: every descendant, instance sublayers included. */
  findAll(fn: (n: FakeNode) => boolean = () => true): FakeNode[] {
    const out: FakeNode[] = []
    const walk = (n: FakeNode) => {
      for (const c of n.children ?? []) {
        if (fn(c)) out.push(c)
        if (CONTAINERS.has(c.type)) walk(c)
      }
    }
    walk(this)
    return out
  }
  findOne(fn: (n: FakeNode) => boolean): FakeNode | null {
    return this.findAll(fn)[0] ?? null
  }
  findChildren(fn: (n: FakeNode) => boolean = () => true) {
    return this.children.filter(fn)
  }

  /* geometry: Figma lays auto layout out synchronously and plugins read the
   * result, so the fake estimates it (text at an average glyph width). */
  private autoLayout() {
    return AUTO_LAYOUT.has(this.type) && this._layoutMode !== 'NONE'
  }
  private bound(field: string): number | undefined {
    const b = this.boundVariables[field] as Json | undefined
    const v = b ? resolveVariable(this.env, b.id as string) : undefined
    return typeof v === 'number' ? v : undefined
  }
  private pad(axis: 'H' | 'V') {
    const p = (f: string, v: number) => this.bound(f) ?? v
    const stroke = this.strokesIncludedInLayout && this._strokes.length ? (axis === 'H' ? this.strokeLeftWeight + this.strokeRightWeight : this.strokeTopWeight + this.strokeBottomWeight) : 0
    return (axis === 'H' ? p('paddingLeft', this.paddingLeft) + p('paddingRight', this.paddingRight) : p('paddingTop', this.paddingTop) + p('paddingBottom', this.paddingBottom)) + stroke
  }
  private flowKids() {
    return this._children.filter((c) => c.visible && c._layoutPositioning !== 'ABSOLUTE')
  }
  /** A child's size along an axis as its parent sees it when hugging: fill children count at their own size. */
  private intrinsic(axis: 'H' | 'V'): number {
    const fill = axis === 'H' ? this.sizingH === 'FILL' : this.sizingV === 'FILL'
    if (!fill) return axis === 'H' ? this.width : this.height
    if (this.type === 'TEXT') return axis === 'H' ? Math.min(this.textWidth(), 320) : this.textHeight()
    if (this.autoLayout()) return this.hug(axis)
    return axis === 'H' ? this._w : this._h
  }
  private hug(axis: 'H' | 'V'): number {
    const primary = (axis === 'H') === (this._layoutMode === 'HORIZONTAL')
    const sizes = this.flowKids().map((k) => k.intrinsic(axis))
    const gap = this.bound('itemSpacing') ?? this.itemSpacing
    const inner = primary ? sizes.reduce((a, b) => a + b, 0) + gap * Math.max(0, sizes.length - 1) : Math.max(0, ...sizes)
    return inner + this.pad(axis)
  }
  private filled(axis: 'H' | 'V'): number {
    const p = this.parent!
    const inner = (axis === 'H' ? p.width : p.height) - p.pad(axis)
    const primary = (axis === 'H') === (p._layoutMode === 'HORIZONTAL')
    if (!primary) return Math.max(1, inner)
    const kids = p.flowKids()
    const fills = kids.filter((k) => (axis === 'H' ? k.sizingH : k.sizingV) === 'FILL')
    const fixed = kids.filter((k) => !fills.includes(k)).reduce((a, k) => a + (axis === 'H' ? k.width : k.height), 0)
    const gap = p.bound('itemSpacing') ?? p.itemSpacing
    return Math.max(1, (inner - fixed - gap * Math.max(0, kids.length - 1)) / Math.max(1, fills.length))
  }
  private fillsIn(axis: 'H' | 'V') {
    return (axis === 'H' ? this.sizingH : this.sizingV) === 'FILL' && !!this.parent && AUTO_LAYOUT.has(this.parent.type) && this.parent._layoutMode !== 'NONE'
  }
  get width(): number {
    if (this.fillsIn('H')) return this.filled('H')
    if (this.type === 'TEXT') return this._textAutoResize === 'WIDTH_AND_HEIGHT' ? this.textWidth() : this._w
    const b = this.bound('width')
    if (b !== undefined) return b
    if (this.autoLayout() && this.sizingH === 'HUG') return this.hug('H')
    return this._w
  }
  get height(): number {
    if (this.fillsIn('V')) return this.filled('V')
    if (this.type === 'TEXT') return this._textAutoResize === 'NONE' ? this._h : this.textHeight()
    const b = this.bound('height')
    if (b !== undefined) return b
    if (this.autoLayout() && this.sizingV === 'HUG') return this.hug('V')
    return this._h
  }
  resize(w: number, h: number) {
    this.live()
    if (!(w >= 0.01) || !(h >= 0.01)) fail(`in resize: size must be at least 0.01 (got ${w} × ${h})`)
    if (this.type === 'TEXT') this.env.requireFont(this._font, `resize on "${this.name}"`)
    this._w = w
    this._h = h
    if (this.type === 'TEXT' && this._textAutoResize === 'WIDTH_AND_HEIGHT') this._textAutoResize = 'HEIGHT'
    if (this.sizingH === 'HUG') this.sizingH = 'FIXED'
    if (this.sizingV === 'HUG') this.sizingV = 'FIXED'
  }
  resizeWithoutConstraints(w: number, h: number) {
    this.resize(w, h)
  }
  /** Like the Scale tool: the fake records the factor, and the preview scales the subtree. */
  rescale(s: number) {
    if (!(s >= 0.01)) fail('in rescale: scale must be at least 0.01')
    this._w *= s
    this._h *= s
    this.scale = (this.scale ?? 1) * s
  }
  scale?: number

  get opacity() {
    return this._opacity
  }
  set opacity(v: number) {
    if (!within01(v)) fail('opacity must be 0–1')
    this._opacity = v
  }
  get fills(): Json[] {
    return this._fills
  }
  set fills(list: Json[]) {
    this.live()
    list.forEach(checkPaint)
    this._fills = list.map((p) => structuredClone(p))
  }
  get strokes(): Json[] {
    return this._strokes
  }
  set strokes(list: Json[]) {
    this.live()
    list.forEach(checkPaint)
    this._strokes = list.map((p) => structuredClone(p))
  }
  get effects(): Json[] {
    return this._effects
  }
  set effects(list: Json[]) {
    list.forEach(checkEffect)
    this._effects = list.map((e) => structuredClone(e))
  }
  get effectStyleId() {
    return this.effectStyleIdValue
  }
  set effectStyleId(_: string) {
    fail('Cannot set effectStyleId with documentAccess: dynamic-page. Use setEffectStyleIdAsync.')
  }
  async setEffectStyleIdAsync(id: string) {
    // '' unlinks the style and, as in Figma, leaves its effects on the node.
    if (id === '') {
      this.effectStyleIdValue = ''
      return
    }
    const s = this.env.styles.find((x) => x.id === id && x.type === 'EFFECT') as FakeEffectStyle | undefined
    if (!s) fail(`No effect style ${id}`)
    this._effects = s.effects.map((e) => structuredClone(e))
    this.effectStyleIdValue = id
  }

  /* auto layout */
  get layoutMode() {
    return this._layoutMode
  }
  set layoutMode(m: string) {
    if (!AUTO_LAYOUT.has(this.type)) fail(`${this.type} has no layoutMode`)
    if (!['NONE', 'HORIZONTAL', 'VERTICAL', 'GRID'].includes(m)) fail(`bad layoutMode ${m}`)
    if (this._layoutMode === 'NONE' && m !== 'NONE') {
      this.primaryAxisSizingMode = 'AUTO'
      this.counterAxisSizingMode = 'FIXED'
    }
    this._layoutMode = m
  }
  get counterAxisAlignItems() {
    return this._counterAlign
  }
  set counterAxisAlignItems(v: string) {
    if (!['MIN', 'MAX', 'CENTER', 'BASELINE'].includes(v)) fail(`bad counterAxisAlignItems ${v}`)
    if (v === 'BASELINE' && this._layoutMode !== 'HORIZONTAL') fail(`BASELINE alignment needs horizontal auto layout ("${this.name}")`)
    this._counterAlign = v
  }
  get layoutWrap() {
    return this._layoutWrap
  }
  set layoutWrap(w: string) {
    if (w === 'WRAP' && this._layoutMode !== 'HORIZONTAL') fail('layoutWrap WRAP needs horizontal auto layout')
    this._layoutWrap = w
  }
  private parentAuto() {
    return !!this.parent && AUTO_LAYOUT.has(this.parent.type) && this.parent._layoutMode !== 'NONE'
  }
  private setSizing(axis: 'H' | 'V', v: string) {
    this.live()
    if (v === 'HUG' && !(this.type === 'TEXT' || (AUTO_LAYOUT.has(this.type) && this._layoutMode !== 'NONE')))
      fail(`HUG can only be set on auto-layout frames and text (on ${this.type} "${this.name}")`)
    if (v === 'FILL' && !this.parentAuto()) fail(`FILL can only be set on children of auto-layout frames ("${this.name}")`)
    if (axis === 'H') this.sizingH = v
    else this.sizingV = v
    if (this.type === 'TEXT' && v === 'HUG') this._textAutoResize = axis === 'H' ? 'WIDTH_AND_HEIGHT' : this._textAutoResize === 'NONE' ? 'HEIGHT' : this._textAutoResize
  }
  get layoutSizingHorizontal() {
    return this.sizingH
  }
  set layoutSizingHorizontal(v: string) {
    this.setSizing('H', v)
  }
  get layoutSizingVertical() {
    return this.sizingV
  }
  set layoutSizingVertical(v: string) {
    this.setSizing('V', v)
  }
  get layoutPositioning() {
    return this._layoutPositioning
  }
  set layoutPositioning(v: string) {
    if (v === 'ABSOLUTE' && !this.parentAuto()) fail('ABSOLUTE positioning needs an auto-layout parent')
    this._layoutPositioning = v
  }

  /* text */
  private textNode(what: string) {
    if (this.type !== 'TEXT') fail(`${this.type} has no ${what}`)
  }
  private editText(what: string) {
    this.textNode(what)
    this.env.requireFont(this._font, `${what} on "${this.name}"`)
  }
  get characters() {
    return this._characters
  }
  set characters(v: string) {
    this.editText('characters')
    this._characters = v
  }
  get fontName() {
    return this._font
  }
  set fontName(f: FontName) {
    this.textNode('fontName')
    this.env.requireFont(f, 'fontName')
    this._font = { ...f }
  }
  get fontSize() {
    return this._fontSize
  }
  set fontSize(v: number) {
    this.editText('fontSize')
    this._fontSize = v
  }
  get lineHeight() {
    return this._lineHeight
  }
  set lineHeight(v: unknown) {
    this.editText('lineHeight')
    this._lineHeight = v
  }
  get letterSpacing() {
    return this._letterSpacing
  }
  set letterSpacing(v: unknown) {
    this.editText('letterSpacing')
    this._letterSpacing = v
  }
  get textCase() {
    return this._textCase
  }
  set textCase(v: string) {
    this.editText('textCase')
    this._textCase = v
  }
  get textAutoResize() {
    return this._textAutoResize
  }
  set textAutoResize(v: string) {
    this.editText('textAutoResize')
    if (v === 'TRUNCATE') fail('textAutoResize TRUNCATE is deprecated: use textTruncation and maxLines')
    if (!['NONE', 'WIDTH_AND_HEIGHT', 'HEIGHT'].includes(v)) fail(`bad textAutoResize ${v}`)
    this._textAutoResize = v
    if (v === 'WIDTH_AND_HEIGHT') {
      this.sizingH = 'HUG'
      this.sizingV = 'HUG'
    }
  }
  get textTruncation() {
    return this._textTruncation
  }
  set textTruncation(v: string) {
    this.editText('textTruncation')
    if (!['DISABLED', 'ENDING'].includes(v)) fail(`bad textTruncation ${v}`)
    this._textTruncation = v
  }
  get maxLines() {
    return this._maxLines
  }
  set maxLines(v: number | null) {
    this.editText('maxLines')
    if (v !== null && this._textTruncation !== 'ENDING') fail('maxLines only applies when textTruncation is ENDING')
    if (v !== null && !(v >= 1)) fail('maxLines must be at least 1')
    this._maxLines = v
  }
  get textStyleId() {
    return this.textStyleIdValue
  }
  set textStyleId(_: string) {
    fail('Cannot set textStyleId with documentAccess: dynamic-page. Use setTextStyleIdAsync.')
  }
  async setTextStyleIdAsync(id: string) {
    this.textNode('textStyleId')
    const s = this.env.styles.find((x) => x.id === id && x.type === 'TEXT') as FakeTextStyle | undefined
    if (!s) fail(`No text style ${id}`)
    this.env.requireFont(s.fontName, 'setTextStyleIdAsync')
    this._font = { ...s.fontName }
    this._fontSize = s.fontSize
    this._lineHeight = s.lineHeight
    this._letterSpacing = s.letterSpacing
    this._textCase = s.textCase
    this.textStyleIdValue = id
  }
  private charWidth() {
    const ls = this._letterSpacing as Json
    const extra = ls && ls.unit === 'PERCENT' ? ((ls.value as number) / 100) * this._fontSize : ((ls?.value as number | undefined) ?? 0)
    return this._fontSize * (/mono/i.test(this._font.family) ? 0.6 : 0.53) + extra
  }
  private textWidth() {
    return Math.max(1, ...this._characters.split('\n').map((l) => l.length)) * this.charWidth()
  }
  private textHeight() {
    const lh = this._lineHeight as Json
    const line = lh && lh.unit === 'PIXELS' ? (lh.value as number) : this._fontSize * 1.25
    if (this._textAutoResize === 'WIDTH_AND_HEIGHT') return line * Math.max(1, this._characters.split('\n').length)
    const width = this.fillsIn('H') ? this.filled('H') : this._w
    const perLine = Math.max(1, Math.floor(width / this.charWidth()))
    const lines = this._characters.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0)
    return line * (this._textTruncation === 'ENDING' && this._maxLines ? Math.min(lines, this._maxLines) : lines)
  }

  /* variables */
  setBoundVariable(field: string, variable: FakeVariable | null) {
    this.live()
    if (!BINDABLE.includes(field)) fail(`Cannot bind ${field}`)
    if (variable) {
      const want = field === 'visible' ? 'BOOLEAN' : field === 'characters' ? 'STRING' : 'FLOAT'
      if (variable.resolvedType !== want) fail(`${field} needs a ${want} variable, got ${variable.resolvedType}`)
      if (['itemSpacing', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'counterAxisSpacing'].includes(field) && this._layoutMode === 'NONE')
        fail(`${field} needs auto layout ("${this.name}")`)
      if (field === 'characters') this.editText('characters')
      this.boundVariables[field] = { type: 'VARIABLE_ALIAS', id: variable.id }
    } else delete this.boundVariables[field]
  }
  setExplicitVariableModeForCollection(collection: FakeCollection | string, modeId: string) {
    if (typeof collection === 'string') fail('setExplicitVariableModeForCollection(collectionId) throws with documentAccess: dynamic-page')
    if (!['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'SECTION', 'PAGE', 'GROUP'].includes(this.type)) fail(`${this.type} cannot have explicit modes`)
    if (!collection.modes.some((m) => m.modeId === modeId)) fail('mode is not in that collection')
    this.explicitVariableModes[collection.id] = modeId
  }
  clearExplicitVariableModeForCollection(collection: FakeCollection) {
    delete this.explicitVariableModes[collection.id]
  }

  /* components */
  get componentPropertyDefinitions() {
    if (this.type !== 'COMPONENT' && this.type !== 'COMPONENT_SET') fail(`${this.type} has no componentPropertyDefinitions`)
    if (this.type === 'COMPONENT' && this.parent?.type === 'COMPONENT_SET') fail('Can only get component property definitions of a component set or non-variant component')
    const defs: Record<string, unknown> = structuredClone(this.properties)
    if (this.type === 'COMPONENT_SET') {
      const options = new Map<string, string[]>()
      for (const c of this._children) {
        for (const [k, v] of Object.entries(c.variantProperties ?? {})) {
          const list = options.get(k) ?? []
          if (!list.includes(v)) list.push(v)
          options.set(k, list)
        }
      }
      for (const [k, list] of options) defs[k] = { type: 'VARIANT', defaultValue: list[0], variantOptions: list }
    }
    return defs
  }
  addComponentProperty(name: string, type: string, defaultValue: unknown, options?: Json) {
    if (this.type !== 'COMPONENT' && this.type !== 'COMPONENT_SET') fail('addComponentProperty needs a component or component set')
    if (this.type === 'COMPONENT' && this.parent?.type === 'COMPONENT_SET') fail('Cannot add properties to a variant: add them to the component set')
    if (!['BOOLEAN', 'TEXT', 'INSTANCE_SWAP'].includes(type)) fail(`addComponentProperty: ${type} is not used by the kit`)
    if (type === 'BOOLEAN' && typeof defaultValue !== 'boolean') fail('BOOLEAN default must be boolean')
    if (type === 'TEXT' && typeof defaultValue !== 'string') fail('TEXT default must be a string')
    if (type === 'INSTANCE_SWAP') {
      const target = this.env.byId(defaultValue as string)
      if (!target || target.type !== 'COMPONENT') fail('INSTANCE_SWAP default must be a component id')
    }
    if (Object.keys(this.properties).some((k) => k.split('#')[0] === name)) fail(`Property ${name} already exists`)
    const id = `${name}#${nextId++}:0`
    this.properties[id] = { type, defaultValue, ...(options?.preferredValues ? { preferredValues: options.preferredValues as unknown[] } : {}) }
    return id
  }
  editComponentProperty(name: string, value: Json) {
    const p = this.properties[name] ?? fail(`No property ${name}`)
    if (value.defaultValue !== undefined) p.defaultValue = value.defaultValue
    if (value.preferredValues !== undefined) p.preferredValues = value.preferredValues as unknown[]
    if (value.name !== undefined) {
      const id = `${value.name as string}#${name.split('#')[1]}`
      delete this.properties[name]
      this.properties[id] = p
      return id
    }
    return name
  }
  deleteComponentProperty(name: string) {
    if (!this.properties[name]) fail(`No property ${name}`)
    delete this.properties[name]
  }
  get componentPropertyReferences() {
    return this._refs
  }
  set componentPropertyReferences(refs: Record<string, string> | null) {
    let owner: FakeNode | null = this.parent
    while (owner && owner.type !== 'COMPONENT' && owner.type !== 'COMPONENT_SET') owner = owner.parent
    if (owner?.type === 'COMPONENT' && owner.parent?.type === 'COMPONENT_SET') owner = owner.parent
    if (!owner) fail('componentPropertyReferences needs a component sublayer')
    for (const [field, prop] of Object.entries(refs ?? {})) {
      const def = owner.properties[prop] ?? fail(`No component property ${prop} on ${owner.name}`)
      const want = field === 'characters' ? 'TEXT' : field === 'visible' ? 'BOOLEAN' : field === 'mainComponent' ? 'INSTANCE_SWAP' : fail(`bad reference field ${field}`)
      if (def.type !== want) fail(`${field} must reference a ${want} property`)
      if (field === 'characters' && this.type !== 'TEXT') fail('characters references need a text layer')
      if (field === 'mainComponent' && this.type !== 'INSTANCE') fail('mainComponent references need an instance')
    }
    this._refs = refs ? { ...refs } : null
  }
  get variantProperties(): Record<string, string> | null {
    if (this.type !== 'COMPONENT' || this.parent?.type !== 'COMPONENT_SET') return null
    return Object.fromEntries(this.name.split(',').map((kv) => kv.split('=').map((s) => s.trim()) as [string, string]))
  }
  createInstance(): FakeNode {
    if (this.type !== 'COMPONENT') fail('createInstance needs a component')
    const inst = this.env.cloneTree(this, 'INSTANCE')
    inst.mainComponentId = this.id
    this.env.currentPage.appendChild(inst)
    return inst
  }
  get mainComponent(): never {
    return fail('Cannot read mainComponent with documentAccess: dynamic-page. Use getMainComponentAsync.')
  }
  async getMainComponentAsync() {
    return this.mainComponentId ? this.env.byId(this.mainComponentId) : null
  }
  setProperties(values: Record<string, unknown>) {
    if (this.type !== 'INSTANCE') fail('setProperties needs an instance')
    const main = this.env.byId(this.mainComponentId!)!
    const owner = main.parent?.type === 'COMPONENT_SET' ? main.parent : main
    const defs = owner.componentPropertyDefinitions as Record<string, Json>
    for (const [k, v] of Object.entries(values)) {
      const def = defs[k] ?? fail(`No property ${k} on ${owner.name}`)
      if (def.type === 'VARIANT') {
        const target = owner.rawChildren().find((c) => c.variantProperties?.[k] === v && Object.entries(main.variantProperties ?? {}).every(([kk, vv]) => kk === k || c.variantProperties?.[kk] === vv))
        if (!target) fail(`No variant with ${k}=${String(v)}`)
        this.swapComponent(target)
      } else {
        this.instanceProps[k] = v
        // The property reaches the layers that reference it, as in Figma.
        for (const n of this.findAll((x) => Object.values(x.componentPropertyReferences ?? {}).includes(k))) {
          const refs = n.componentPropertyReferences!
          if (refs.characters === k) {
            this.env.requireFont(n.fontName, 'setProperties (text)')
            n._characters = String(v)
          }
          if (refs.visible === k) n.visible = Boolean(v)
          if (refs.mainComponent === k) n.swapComponent(this.env.byId(String(v)) ?? fail(`no component ${String(v)}`))
        }
      }
    }
  }
  swapComponent(component: FakeNode) {
    if (component.type !== 'COMPONENT') fail('swapComponent needs a component')
    const fresh = this.env.cloneTree(component, 'INSTANCE')
    this._children = fresh._children
    for (const c of this._children) c.parent = this
    this.mainComponentId = component.id
    this._w = component.width
    this._h = component.height
  }
  get componentProperties() {
    if (this.type !== 'INSTANCE') fail('componentProperties needs an instance')
    const main = this.env.byId(this.mainComponentId!)
    const owner = main?.parent?.type === 'COMPONENT_SET' ? main.parent : main
    const out: Record<string, { type: string; value: unknown }> = {}
    for (const [k, def] of Object.entries(owner?.properties ?? {})) out[k] = { type: def.type, value: this.instanceProps[k] ?? def.defaultValue }
    for (const [k, v] of Object.entries(main?.variantProperties ?? {})) out[k] = { type: 'VARIANT', value: v }
    return out
  }
  clone(): FakeNode {
    const copy = this.env.cloneTree(this, this.type)
    this.parent?.appendChild(copy)
    return copy
  }
}

/* ── The environment ──────────────────────────────────────────────────── */

export class FakeEnv {
  opts: Required<FakeOptions>
  pages: FakeNode[] = []
  root: FakeNode
  currentPage: FakeNode
  collections: FakeCollection[] = []
  variables: FakeVariable[] = []
  styles: FakeStyle[] = []
  loadedFonts = new Set<string>()
  images = new Map<string, Uint8Array>()
  notifications: string[] = []
  closed: string | undefined
  ui: { html: string; options: Json; messages: Json[]; onmessage?: (msg: unknown) => void } | undefined
  console: string[] = []

  constructor(opts: FakeOptions = {}) {
    this.opts = { modeLimit: 10, pageLimit: Infinity, command: '', fonts: DEFAULT_FONTS, unloadable: [], failures: {}, ...opts }
    this.root = new FakeNode(this, 'DOCUMENT')
    this.root.name = 'Untitled'
    const page = new FakeNode(this, 'PAGE')
    page.name = 'Page 1'
    this.root.appendChild(page)
    this.pages.push(page)
    this.currentPage = page
  }

  maybeFail(point: FailPoint) {
    const message = this.opts.failures[point]
    if (message) fail(message)
  }

  requireFont(f: FontName, what: string) {
    if (!this.loadedFonts.has(`${f.family}/${f.style}`)) fail(`Cannot write to node with unloaded font "${f.family} ${f.style}" (${what}). Please call figma.loadFontAsync first.`)
  }

  byId(id: string): FakeNode | null {
    let hit: FakeNode | null = null
    const walk = (n: FakeNode) => {
      if (n.id === id) hit = n
      n.rawChildren().forEach(walk)
    }
    walk(this.root)
    return hit
  }

  checkCycles(start: FakeVariable) {
    const seen = new Set<string>()
    const visit = (v: FakeVariable) => {
      if (seen.has(v.id)) fail(`alias cycle through ${v.name}`)
      seen.add(v.id)
      for (const value of Object.values(v.valuesByMode)) {
        const a = value as Json
        if (a && a.type === 'VARIABLE_ALIAS') {
          const t = this.variables.find((x) => x.id === a.id)
          if (t) visit(t)
        }
      }
      seen.delete(v.id)
    }
    visit(start)
  }

  cloneTree(src: FakeNode, type: string): FakeNode {
    const n = new FakeNode(this, type)
    for (const [k, v] of Object.entries(src)) {
      if (['id', 'parent', 'env', 'type', '_children', 'data', 'removed', 'properties', '_refs', 'key'].includes(k)) continue
      ;(n as unknown as Json)[k] = structuredClone(v)
    }
    ;(n as unknown as Json)._refs = (src as unknown as Json)._refs
    for (const c of src.rawChildren()) {
      const cc = this.cloneTree(c, c.type === 'COMPONENT' ? 'INSTANCE' : c.type)
      if (c.type === 'COMPONENT') cc.mainComponentId = c.id
      n.rawChildren().push(cc)
      cc.parent = n
    }
    return n
  }

  node(type: string, name: string) {
    const n = new FakeNode(this, type)
    n.name = name
    return n
  }

  svgNode(svg: string): FakeNode {
    this.maybeFail('createNodeFromSvg')
    const frame = this.node('FRAME', 'Svg')
    const w = Number(/width="([\d.]+)"/.exec(svg)?.[1] ?? 100)
    const h = Number(/height="([\d.]+)"/.exec(svg)?.[1] ?? 100)
    frame.resize(w, h)
    this.currentPage.appendChild(frame)
    for (const [, attrs] of svg.matchAll(/<path\s([^>]*?)\/?>/g)) {
      const attr = (name: string) => new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs!)?.[1]
      const d = attr('d') ?? fail('svg path without d')
      const v = this.node('VECTOR', 'Vector')
      const b = bounds(parsePath(d))
      v.x = b.minX
      v.y = b.minY
      ;(v as unknown as Json)._w = Math.max(0, b.maxX - b.minX)
      ;(v as unknown as Json)._h = Math.max(0, b.maxY - b.minY)
      v.svgPath = d
      v.svgOrigin = { x: b.minX, y: b.minY }
      if (attr('fill-rule') === 'evenodd') v.windingRule = 'EVENODD'
      const paint = (c: string | undefined) => {
        if (!c || c === 'none') return []
        // A gradient: Figma imports it as one; the fake keeps a stand-in solid.
        if (c.startsWith('url(')) return [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }]
        const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(c)
        const hex = short ? `${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : (/^#([0-9a-f]{6})$/i.exec(c)?.[1] ?? fail(`svg colour ${c} must be hex`))
        return [{ type: 'SOLID', color: { r: parseInt(hex.slice(0, 2), 16) / 255, g: parseInt(hex.slice(2, 4), 16) / 255, b: parseInt(hex.slice(4, 6), 16) / 255 } }]
      }
      v.fills = paint(attr('fill') ?? '#000000')
      v.strokes = paint(attr('stroke'))
      v.strokeWeight = Number(attr('stroke-width') ?? 1)
      v.strokeAlign = 'CENTER'
      if (attr('stroke-linecap') === 'round') v.strokeCap = 'ROUND'
      if (attr('stroke-linejoin') === 'round') v.strokeJoin = 'ROUND'
      frame.appendChild(v)
    }
    return frame
  }
}

export function createFakeFigma(opts: FakeOptions = {}) {
  const env = new FakeEnv(opts)
  const created = (type: string, name: string) => {
    const n = env.node(type, name)
    env.currentPage.appendChild(n)
    return n
  }
  const figma = {
    get command() {
      return env.opts.command
    },
    mixed: Symbol('mixed'),
    root: env.root,
    get currentPage() {
      return env.currentPage
    },
    set currentPage(_: FakeNode) {
      fail('Cannot set currentPage with documentAccess: dynamic-page. Use setCurrentPageAsync.')
    },
    async setCurrentPageAsync(page: FakeNode) {
      page.loaded = true
      env.currentPage = page
    },
    async loadAllPagesAsync() {
      env.pages.forEach((p) => (p.loaded = true))
    },
    createPage() {
      if (env.pages.length >= env.opts.pageLimit) fail(env.opts.failures.createPage ?? `The Starter plan only comes with ${env.opts.pageLimit} pages. Upgrade to Professional for unlimited pages.`)
      const p = env.node('PAGE', 'Page')
      p.loaded = false
      env.root.appendChild(p)
      env.pages.push(p)
      return p
    },
    createFrame: () => created('FRAME', 'Frame'),
    createComponent: () => created('COMPONENT', 'Component'),
    createText: () => created('TEXT', 'Text'),
    createRectangle: () => created('RECTANGLE', 'Rectangle'),
    createEllipse: () => created('ELLIPSE', 'Ellipse'),
    createSection: () => created('SECTION', 'Section'),
    createNodeFromSvg: (svg: string) => env.svgNode(svg),
    createImage(bytes: Uint8Array) {
      env.maybeFail('createImage')
      if (!(bytes instanceof Uint8Array) || bytes.length < 8) fail('createImage needs image bytes')
      const hash = `img${bytes.length}-${bytes[bytes.length - 1]}-${env.images.size}`
      env.images.set(hash, bytes)
      return { hash, getBytesAsync: async () => bytes, getSizeAsync: async () => ({ width: 1, height: 1 }) }
    },
    group(nodes: FakeNode[], parent: FakeNode, index?: number) {
      if (!nodes.length) fail('group() needs at least one node')
      const g = env.node('GROUP', 'Group')
      parent.insertChild(index ?? parent.rawChildren().length, g)
      for (const n of nodes) g.appendChild(n)
      const xs = nodes.map((n) => n.x)
      const ys = nodes.map((n) => n.y)
      g.x = Math.min(...xs)
      g.y = Math.min(...ys)
      return g
    },
    combineAsVariants(nodes: FakeNode[], parent: FakeNode, index?: number) {
      env.maybeFail('combineAsVariants')
      if (!nodes.length) fail('combineAsVariants needs components')
      for (const n of nodes) {
        if (n.type !== 'COMPONENT') fail('combineAsVariants: every node must be a component')
        if (!/^[^=,]+=[^=,]+(,\s*[^=,]+=[^=,]+)*$/.test(n.name)) fail(`variant name "${n.name}" is not Property=Value`)
      }
      const set = env.node('COMPONENT_SET', 'Component set')
      parent.insertChild(index ?? parent.rawChildren().length, set)
      for (const n of nodes) set.appendChild(n)
      return set
    },
    async loadFontAsync(f: FontName) {
      if (!env.opts.fonts.some((x) => x.family === f.family && x.style === f.style)) fail(`Font "${f.family} ${f.style}" is not available`)
      if (env.opts.unloadable.some((x) => x.family === f.family && x.style === f.style)) fail(`Failed to load font "${f.family} ${f.style}"`)
      env.loadedFonts.add(`${f.family}/${f.style}`)
    },
    async listAvailableFontsAsync() {
      return env.opts.fonts.map((fontName) => ({ fontName }))
    },
    getLocalTextStyles: () => fail('getLocalTextStyles throws with dynamic-page; use getLocalTextStylesAsync'),
    getLocalEffectStyles: () => fail('getLocalEffectStyles throws with dynamic-page; use getLocalEffectStylesAsync'),
    async getLocalTextStylesAsync() {
      return env.styles.filter((s) => s.type === 'TEXT')
    },
    async getLocalEffectStylesAsync() {
      return env.styles.filter((s) => s.type === 'EFFECT')
    },
    createTextStyle() {
      const s = new FakeTextStyle(env)
      env.styles.push(s)
      return s
    },
    createEffectStyle() {
      const s = new FakeEffectStyle(env)
      env.styles.push(s)
      return s
    },
    async getStyleByIdAsync(id: string) {
      return env.styles.find((s) => s.id === id) ?? null
    },
    getNodeById: () => fail('getNodeById throws with dynamic-page; use getNodeByIdAsync'),
    async getNodeByIdAsync(id: string) {
      return env.byId(id)
    },
    base64Decode: (s: string) => new Uint8Array(Buffer.from(s, 'base64')),
    showUI(html: string, options: Json = {}) {
      env.maybeFail('showUI')
      if (typeof html !== 'string') fail('showUI needs HTML')
      env.ui = { html, options, messages: [] }
    },
    ui: {
      postMessage(msg: Json) {
        if (!env.ui) fail('figma.ui.postMessage before showUI')
        env.ui.messages.push(structuredClone(msg))
      },
      set onmessage(fn: (msg: unknown) => void) {
        if (!env.ui) fail('figma.ui.onmessage before showUI')
        env.ui.onmessage = fn
      },
    },
    notify(message: string) {
      env.notifications.push(message)
      return { cancel() {} }
    },
    closePlugin(message?: string) {
      env.closed = message ?? ''
    },
    viewport: { scrollAndZoomIntoView() {}, center: { x: 0, y: 0 }, zoom: 1 },
    variables: {
      getLocalVariableCollections: () => fail('getLocalVariableCollections throws with dynamic-page'),
      getLocalVariables: () => fail('getLocalVariables throws with dynamic-page'),
      getVariableById: () => fail('getVariableById throws with dynamic-page'),
      async getLocalVariableCollectionsAsync() {
        return [...env.collections]
      },
      async getLocalVariablesAsync(type?: string) {
        return env.variables.filter((v) => !type || v.resolvedType === type)
      },
      async getVariableByIdAsync(id: string) {
        return env.variables.find((v) => v.id === id) ?? null
      },
      async getVariableCollectionByIdAsync(id: string) {
        return env.collections.find((c) => c.id === id) ?? null
      },
      createVariableCollection(name: string) {
        const c = new FakeCollection(env, name)
        env.collections.push(c)
        return c
      },
      createVariable(name: string, collection: FakeCollection | string, type: string) {
        if (typeof collection === 'string') fail('createVariable(collectionId) throws with dynamic-page; pass the collection')
        if (!env.collections.includes(collection)) fail('createVariable: unknown collection')
        if (!['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'].includes(type)) fail(`bad variable type ${type}`)
        const v = new FakeVariable(env, name, collection.id, type)
        for (const m of collection.modes) v.valuesByMode[m.modeId] = type === 'COLOR' ? { r: 0, g: 0, b: 0, a: 1 } : type === 'FLOAT' ? 0 : type === 'STRING' ? '' : false
        env.variables.push(v)
        return v
      },
      createVariableAlias(v: FakeVariable) {
        if (!env.variables.includes(v)) fail('createVariableAlias: unknown variable')
        return { type: 'VARIABLE_ALIAS', id: v.id }
      },
      setBoundVariableForPaint(paint: Json, field: string, v: FakeVariable | null) {
        if (paint.type !== 'SOLID') fail('Only solid paints can bind a colour variable')
        if (field !== 'color') fail(`paint field ${field} is not bindable`)
        if (v && v.resolvedType !== 'COLOR') fail('paint colour needs a COLOR variable')
        checkPaint(paint)
        const out = structuredClone(paint)
        out.boundVariables = v ? { color: { type: 'VARIABLE_ALIAS', id: v.id } } : {}
        return out
      },
      setBoundVariableForEffect(effect: Json, field: string, v: FakeVariable | null) {
        checkEffect(effect)
        if (!['color', 'radius', 'spread', 'offsetX', 'offsetY'].includes(field)) fail(`effect field ${field} is not bindable`)
        if (v && v.resolvedType !== (field === 'color' ? 'COLOR' : 'FLOAT')) fail(`effect ${field} needs another variable type`)
        const out = structuredClone(effect)
        out.boundVariables = { ...((out.boundVariables as Json) ?? {}), ...(v ? { [field]: { type: 'VARIABLE_ALIAS', id: v.id } } : {}) }
        return out
      },
    },
  }
  return { figma, env }
}

/** Installs a fake as the `figma` global and returns it. */
export function installFakeFigma(opts: FakeOptions = {}) {
  const fake = createFakeFigma(opts)
  ;(globalThis as unknown as { figma: unknown }).figma = fake.figma
  return fake
}

/* ── Inspection helpers for tests ─────────────────────────────────────── */

export function allNodes(env: FakeEnv): FakeNode[] {
  const out: FakeNode[] = []
  const walk = (n: FakeNode) => {
    out.push(n)
    n.rawChildren().forEach(walk)
  }
  walk(env.root)
  return out
}

/** Resolves a variable to a value in the given modes (collection id → mode id), following aliases. */
export function resolveVariable(env: FakeEnv, id: string, modes: Record<string, string> = {}): unknown {
  for (let guard = 0; guard < 20; guard++) {
    const v = env.variables.find((x) => x.id === id)
    if (!v) return undefined
    const c = env.collections.find((x) => x.id === v.variableCollectionId)!
    const value = v.valuesByMode[modes[c.id] ?? c.defaultModeId] as Json
    if (value && value.type === 'VARIABLE_ALIAS') {
      id = value.id as string
      continue
    }
    return value
  }
  return undefined
}
