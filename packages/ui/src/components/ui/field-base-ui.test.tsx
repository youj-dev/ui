import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { Field as FieldPrimitive } from '@base-ui/react/field'
import { useFieldRootContext } from '@base-ui/react/internals/field-root-context'
import { useLabelableContext, useLabelableId } from '@base-ui/react/internals/labelable-provider'

/* Field (field.tsx) reads two Base UI modules that aren't public API:
 * internals/field-root-context and internals/labelable-provider. Base UI may
 * change them in any release, so the peer range bounds @base-ui/react to the
 * minors checked (1.8 and 1.9) and this test fails if a bump changes what Field
 * relies on. Widening the bound means re-checking these, not only this test. */

const pkgDir = join(import.meta.dirname, '../../..')
const read = (file: string) => JSON.parse(readFileSync(file, 'utf8')) as { version: string; devDependencies: Record<string, string>; peerDependencies: Record<string, string> }

describe('the Base UI internals Field depends on', () => {
  test('@base-ui/react is a peer bounded to the checked minors, and the installed copy is in them', () => {
    const manifest = read(join(pkgDir, 'package.json'))
    expect(manifest.peerDependencies['@base-ui/react']).toBe('>=1.8.0 <1.10.0')
    expect(manifest.devDependencies['@base-ui/react']).toMatch(/^(~|)1\.[89]\.\d+$/)
    expect(read(join(pkgDir, 'node_modules/@base-ui/react/package.json')).version).toMatch(/^1\.[89]\.\d+$/)
  })

  test('the hooks still exist', () => {
    expect(typeof useFieldRootContext).toBe('function')
    expect(typeof useLabelableContext).toBe('function')
    expect(typeof useLabelableId).toBe('function')
  })

  test('inside a Field.Root they return the shape useFieldControl reads', () => {
    let seen: { id: unknown; labelId: unknown; describedBy: unknown; invalid: unknown; disabled: unknown; valid: unknown } | undefined
    function Probe() {
      const id = useLabelableId({ enabled: true })
      const { labelId, getDescriptionProps } = useLabelableContext()
      const root = useFieldRootContext(true)
      seen = { id, labelId, describedBy: getDescriptionProps({})['aria-describedby'], invalid: root.invalid, disabled: root.disabled, valid: root.state.valid }
      return <input id={id} />
    }
    render(
      <FieldPrimitive.Root invalid disabled>
        <FieldPrimitive.Label>Email</FieldPrimitive.Label>
        <Probe />
        <FieldPrimitive.Description>We never share it.</FieldPrimitive.Description>
      </FieldPrimitive.Root>,
    )
    expect(seen!.id).toEqual(expect.any(String))
    expect(seen!.labelId).toEqual(expect.any(String))
    expect(seen!.describedBy).toEqual(expect.any(String))
    expect(seen!.invalid).toBe(true)
    expect(seen!.disabled).toBe(true)
    expect(seen).toHaveProperty('valid')
  })

  test('outside a Field they fall back instead of throwing', () => {
    let seen: { id: unknown; root: unknown } | undefined
    function Probe() {
      seen = { id: useLabelableId({ enabled: true }), root: useFieldRootContext(true) }
      return null
    }
    render(<Probe />)
    expect(seen!.id).toEqual(expect.any(String))
    expect(seen!.root).toMatchObject({ state: expect.any(Object) })
  })
})
