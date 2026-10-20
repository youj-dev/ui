import { scan } from './check-shapes.mjs'

const kinds = (src, file = 'packages/ui/src/blocks/app/demo.tsx', read) => scan(src, file, read).map((h) => [h.control, h.kinds.join('+'), Boolean(h.reason)])

test('a corner, height, edge or field fill set on a kit control is caught', () => {
  expect(kinds('<Button className="rounded-full">Go</Button>')).toEqual([['Button', 'radius', false]])
  expect(kinds('<Badge className="h-7 rounded-md">Ok</Badge>')).toEqual([['Badge', 'height+radius', false]])
  expect(kinds('<SelectTrigger className="border-transparent bg-band">x</SelectTrigger>')).toEqual([['SelectTrigger', 'border+fill', false]])
  expect(kinds("<Button className={cn('gap-1', active && 'rounded-xl')} />")).toEqual([['Button', 'radius', false]])
})

test("the theme's own names are what a shape is written in", () => {
  expect(kinds('<Input className="h-control-sm rounded-field-sm" />')).toEqual([])
  expect(kinds('<Toggle className="rounded-chip" />')).toEqual([])
  expect(kinds('<PopoverContent className="h-96 rounded-[min(var(--radius-overlay),var(--ui--panel-radius-max))]" />')).toEqual([])
  expect(kinds('<Card className="h-140 w-full" />')).toEqual([])
})

test('a fill is a field matter: a button or a badge may take a colour', () => {
  expect(kinds('<Button className="bg-fg text-canvas" />')).toEqual([])
  expect(kinds('<Input className="bg-canvas" />')).toEqual([['Input', 'fill', false]])
})

test('a recipe called with extra classes, a class constant and a reach into a control are caught too', () => {
  expect(kinds("<a className={cn(buttonVariants({ size: 'lg' }), 'rounded-xl')} />")).toEqual([['buttonVariants', 'radius', false]])
  expect(kinds("const SOFT = 'border-transparent bg-well'\n\n<Input className={SOFT} />")).toEqual([['Input', 'border+fill', false]])
  expect(kinds('<div className="[&_[data-slot=input-group]]:bg-well" />')).toEqual([['(scope)', 'descendant override', false]])
  expect(kinds("const quiet = '[--color-field:var(--color-band)]'")).toEqual([['(scope)', 'token override', false]])
  expect(kinds('<InputGroup data-yj-soft />')).toEqual([['InputGroup', 'soft override', false]])
})

test("a class aimed at the control's inside, or at a part that isn't a control, is not the control's shape", () => {
  expect(kinds("<Button className=\"[&_svg:not([class*='size-'])]:size-6\" />")).toEqual([])
  expect(kinds('<Card className="[&_[data-slot=progress-list-track]]:rounded-full" />')).toEqual([])
  expect(kinds('<ToolbarPrimitive.Input className="rounded-md" />')).toEqual([])
})

test('an important utility, an arbitrary corner or height, or an inline style on a kit control is caught', () => {
  expect(kinds('<Badge className="normal-case!" />')).toEqual([['Badge', 'important', false]])
  expect(kinds('<SegmentedControlItem className="max-sm:px-1.5!" />')).toEqual([['SegmentedControlItem', 'important', false]])
  expect(kinds('<TabsTrigger className="own:!px-2.5" />')).toEqual([['TabsTrigger', 'important', false]])
  expect(kinds('<Button className="rounded-[13px]" />')).toEqual([['Button', 'radius', false]])
  expect(kinds('<Input className="h-[34px]" />')).toEqual([['Input', 'height', false]])
  expect(kinds('<Button className="size-[30px]" />')).toEqual([['Button', 'height', false]])
  expect(kinds('<Button style={{ borderRadius: 4 }} />')).toEqual([['Button', 'inline style', false]])
  expect(kinds('<Input className="h-control-sm!" />')).toEqual([['Input', 'important', false]])
})

test("an own: corner, height or edge on a kit control is a second definition of it, even in the theme's names", () => {
  expect(kinds('<InputGroup className="own:h-control-sm own:rounded-field-sm" />')).toEqual([['InputGroup', 'own: shape', false]])
  expect(kinds('<Card className="own:hover:border-line-control" />')).toEqual([['Card', 'own: shape', false]])
  expect(kinds('<div className="own:flex own:p-2" />')).toEqual([])
  expect(kinds('<Button className="own:gap-1 own:px-3" />')).toEqual([])
})

test('a reason in the tag, or on the lines above it, documents an exception', () => {
  expect(kinds('<Button\n  // shape: a record button is round by convention\n  className="rounded-full"\n/>')).toEqual([['Button', 'radius', true]])
  expect(kinds('{/* shape: the avatar is round */}\n<Button className="rounded-full" />')).toEqual([['Button', 'radius', true]])
  expect(kinds('<Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong" />')).toEqual([])
})
