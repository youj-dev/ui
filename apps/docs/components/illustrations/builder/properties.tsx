'use client'

import { useId, type ReactNode } from 'react'
import { CopyPlusIcon, TrashIcon } from '@youj/icons'
import { Button, Input, Kbd, NumberInput, Tooltip, TooltipContent, TooltipTrigger } from '@youj/react'
import { InspectorRow, InspectorSection, InspectorSelect, InspectorSwitch } from '@youj/react/docs/inspector'
import { cn } from '@/lib/cn'
import {
  BASE_LABELS,
  BASES,
  hasVariants,
  isRound,
  LATHE_LABELS,
  LATHE_PRESETS,
  partLabel,
  PRISM_LABELS,
  PRISM_PRESETS,
  type Axis,
  type Base,
  type BuilderScene,
  type Facing,
  type LathePreset,
  type Part,
  type PrismPreset,
  type SceneGroup,
  type Shade,
  type Variant,
} from '@youj/illustrations/builder'
import { TEMPLATES, type Template } from '@youj/illustrations/builder'

/* The properties of what's selected: one part's place, size, outline and
 * look, and how it moves when the scene comes apart; the shared look of
 * several; a group's motion; or, with nothing selected, the scene itself
 * (its name, what it stands on, and the templates to start again from).
 * Every edit is a step in the history, and a run of edits to one field is
 * one step. */

export type PartAction = 'duplicate' | 'delete' | 'group' | 'ungroup'

export interface PropertiesProps {
  scene: BuilderScene
  selected: readonly string[]
  names: ReadonlyMap<string, string>
  onParts: (ids: readonly string[], patch: (part: Part) => Part, key: string) => void
  onScene: (patch: Partial<Pick<BuilderScene, 'name' | 'base'>>, key: string) => void
  onGroupChange: (id: string, patch: Partial<SceneGroup>, key: string) => void
  onAction: (action: PartAction) => void
  onTemplate: (template: Template) => void
}

/** What several parts show for a setting they don't share. */
const MIXED = { value: 'mixed' as const, label: 'Mixed' }
const VARIANT_OPTIONS: { value: Variant | 'mixed'; label: string; note?: string }[] = [
  { value: 'solid', label: 'Solid', note: 'Shaded faces, the near edges lit' },
  { value: 'wire', label: 'Wire', note: 'A wireframe, its hidden edges dashed' },
  { value: 'ghost', label: 'Ghost', note: 'A dashed outline: where something will go' },
]
const SHADE_OPTIONS: { value: Shade | 'mixed'; label: string; note?: string }[] = [
  { value: 'neutral', label: 'Neutral', note: 'The default' },
  { value: 'raised', label: 'Raised', note: 'Lighter: the thing in hand' },
  { value: 'sunken', label: 'Sunken', note: 'Darker: bases and wells' },
]
const AXIS_OPTIONS: { value: Axis; label: string; note: string }[] = [
  { value: 'x', label: 'Along x', note: 'Lying toward the lower right' },
  { value: 'y', label: 'Along y', note: 'Lying toward the lower left' },
]
const FACING_OPTIONS: { value: Facing; label: string; note: string }[] = [
  { value: 'left', label: 'Left', note: 'Standing, its face to the lower left (+y)' },
  { value: 'right', label: 'Right', note: 'Standing, its face to the lower right (+x)' },
  { value: 'top', label: 'Up', note: 'Lying flat, its face up' },
]

export function Properties(props: PropertiesProps) {
  const { scene, selected } = props
  const parts = scene.parts.filter((p) => selected.includes(p.id))
  if (!parts.length) return <SceneSettings {...props} />
  const group = scene.groups.find((g) => {
    const members = scene.parts.filter((p) => p.group === g.id).map((p) => p.id)
    return members.length === selected.length && members.every((id) => selected.includes(id))
  })
  if (parts.length === 1) return <PartProperties {...props} part={parts[0]!} />
  return <ManyProperties {...props} parts={parts} group={group} />
}

function Header({ title, detail, onAction, children }: { title: string; detail: string; onAction: (a: PartAction) => void; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="truncate text-[14px] leading-5 font-semibold tracking-tight text-fg">{title}</h2>
        <p className="truncate type-label text-fg-subtle">{detail}</p>
      </div>
      {children}
      <IconAction label="Duplicate" keys="⌘D" onClick={() => onAction('duplicate')}>
        <CopyPlusIcon size={15} strokeWidth={1.75} />
      </IconAction>
      <IconAction label="Delete" keys="⌫" onClick={() => onAction('delete')}>
        <TrashIcon size={15} strokeWidth={1.75} />
      </IconAction>
    </div>
  )
}

function IconAction({ label, keys, onClick, children }: { label: string; keys: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<button type="button" onClick={onClick} aria-label={label} aria-keyshortcuts={keys === '⌫' ? 'Delete Backspace' : 'Meta+D Control+D'} className="icon-button size-8 shrink-0 rounded-md" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        {label}
        <Kbd>{keys}</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

/** A number in grid units, with its axis as a prefix: the fields a design tool leads with. */
function Num({ label, name, value, onChange, step = 0.5, min = 0, max = 8, disabled }: { label: string; name: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; disabled?: boolean }) {
  return (
    <NumberInput
      aria-label={name}
      prefix={<span className="text-[11px] font-medium text-fg-subtle">{label}</span>}
      value={value}
      onValueChange={(v) => v !== null && Number.isFinite(v) && onChange(v)}
      step={step}
      largeStep={step * 4}
      min={min}
      max={max}
      steppers={false}
      disabled={disabled}
      className="h-8 [&_input]:px-1.5 [&_input]:text-[12.5px]"
    />
  )
}

function Fields({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 }) {
  return <div className={cn('grid gap-1.5', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}>{children}</div>
}

function PartProperties({ part, scene, names, onParts, onAction }: PropertiesProps & { part: Part }) {
  const ids = [part.id]
  const set = (field: string, patch: Partial<Part>) => onParts(ids, (p) => ({ ...p, ...patch }) as Part, `${part.id}:${field}`)
  const group = part.group ? scene.groups.findIndex((g) => g.id === part.group) + 1 : 0
  return (
    <div className="flex flex-col gap-5">
      <Header title={names.get(part.id) ?? partLabel(part)} detail={`${part.type}${group ? ` · in group ${group}` : ''}`} onAction={onAction} />

      <InspectorSection title="Position">
        <Fields>
          <Num label="x" name="x, along the lower right" value={part.x} onChange={(x) => set('x', { x })} />
          <Num label="y" name="y, along the lower left" value={part.y} onChange={(y) => set('y', { y })} />
          <Num label="z" name="z, height off the floor" value={part.z} onChange={(z) => set('z', { z })} max={3} />
        </Fields>
      </InspectorSection>

      <InspectorSection title="Size">
        {isRound(part) ? (
          <Fields columns={2}>
            <Num label="r" name="Radius" value={part.r} step={0.25} min={0.25} max={4} onChange={(r) => set('r', { r })} />
            <Num label="h" name="Height" value={part.h} onChange={(h) => set('h', { h })} max={3} />
          </Fields>
        ) : part.type === 'pipe' ? (
          // Round across: its width and height are one.
          <Fields columns={2}>
            <Num label="l" name="Length" value={part.axis === 'x' ? part.w : part.d} min={0.5} onChange={(l) => set('length', part.axis === 'x' ? { w: l } : { d: l })} />
            <Num label="⌀" name="Width across" value={part.h} min={0.25} step={0.25} max={3} onChange={(h) => set('width', { h })} />
          </Fields>
        ) : (
          <Fields>
            <Num label="w" name="Width, along x" value={part.w} min={0.5} onChange={(w) => set('w', { w })} />
            <Num label="d" name="Depth, along y" value={part.d} min={part.type === 'prism' ? 0.1 : 0.5} step={part.type === 'prism' ? 0.25 : 0.5} onChange={(d) => set('d', { d })} />
            <Num label="h" name="Height" value={part.h} step={part.type === 'platform' ? 0.1 : 0.5} onChange={(h) => set('h', { h })} max={3} />
          </Fields>
        )}
      </InspectorSection>

      {part.type === 'prism' && (
        <InspectorSection title="Outline">
          <InspectorSelect label="Shape" value={part.preset} options={PRISM_PRESETS.map((p) => ({ value: p, label: PRISM_LABELS[p] }))} onChange={(preset: PrismPreset) => set('preset', { preset })} />
          <InspectorSelect label="Facing" value={part.facing} options={FACING_OPTIONS} onChange={(facing: Facing) => set('facing', { facing })} />
        </InspectorSection>
      )}
      {part.type === 'lathe' && (
        <InspectorSection title="Profile">
          <InspectorSelect label="Shape" value={part.preset} options={LATHE_PRESETS.map((p) => ({ value: p, label: LATHE_LABELS[p] }))} onChange={(preset: LathePreset) => set('preset', { preset })} />
        </InspectorSection>
      )}
      {part.type === 'pipe' && (
        <InspectorSection title="Pipe">
          <InspectorSelect label="Lies" value={part.axis} options={AXIS_OPTIONS} onChange={(axis: Axis) => set('axis', { axis, w: part.d, d: part.w })} />
        </InspectorSection>
      )}
      {part.type === 'screen' && (
        <InspectorSection title="Screen">
          <InspectorSelect label="Facing" value={part.facing} options={FACING_OPTIONS} onChange={(facing: Facing) => set('facing', { facing })} />
        </InspectorSection>
      )}
      {part.type === 'platform' && (
        <InspectorSection title="Plinth">
          <InspectorSelect
            label="Shape"
            value={part.round ? 'round' : 'square'}
            options={[
              { value: 'square', label: 'Square' },
              { value: 'round', label: 'Round' },
            ]}
            onChange={(v) => set('round', { round: v === 'round' })}
          />
          {!part.round && <InspectorSwitch label="Engraved grid" checked={part.grid} onChange={(grid) => set('grid', { grid })} />}
        </InspectorSection>
      )}

      <Look parts={[part]} onParts={onParts} />
      <Motion lift={part.lift} float={part.float} onLift={(lift) => set('lift', { lift })} onFloat={(float) => set('float', { float })} />
    </div>
  )
}

function Look({ parts, onParts }: { parts: Part[]; onParts: PropertiesProps['onParts'] }) {
  const ids = parts.map((p) => p.id)
  const key = ids.join(',')
  const variants = parts.filter((p) => hasVariants(p.type))
  const lit = parts.every((p) => p.lit)
  const shade = parts.every((p) => p.tone === parts[0]!.tone) ? parts[0]!.tone : null
  const variant = variants.length && variants.every((p) => p.variant === variants[0]!.variant) ? variants[0]!.variant : null
  return (
    <InspectorSection title="Look">
      <InspectorSwitch label="Lit" note="The accent part: the one the scene is about" checked={lit} onChange={(on) => onParts(ids, (p) => ({ ...p, lit: on }), `${key}:lit`)} />
      {lit ? (
        <InspectorRow label="Shade">
          <span className="text-ui-sm text-fg-subtle">The accent</span>
        </InspectorRow>
      ) : (
        <InspectorSelect
          label="Shade"
          value={shade ?? 'mixed'}
          options={shade ? SHADE_OPTIONS : [MIXED, ...SHADE_OPTIONS]}
          onChange={(tone) => tone !== 'mixed' && onParts(ids, (p) => ({ ...p, tone }), `${key}:tone`)}
        />
      )}
      {variants.length ? (
        <InspectorSelect
          label="Variant"
          value={variant ?? 'mixed'}
          options={variant ? VARIANT_OPTIONS : [MIXED, ...VARIANT_OPTIONS]}
          onChange={(v) => v !== 'mixed' && onParts(variants.map((p) => p.id), (p) => ({ ...p, variant: v }), `${key}:variant`)}
        />
      ) : (
        <InspectorRow label="Variant">
          <span className="text-ui-sm text-fg-subtle">Solid only</span>
        </InspectorRow>
      )}
    </InspectorSection>
  )
}

function Motion({ lift, float, onLift, onFloat }: { lift: number; float: number; onLift: (v: number) => void; onFloat: (v: number) => void }) {
  return (
    <InspectorSection title="Motion">
      <Fields columns={2}>
        <Num label="lift" name="Lift: how far it rises when the scene comes apart" value={lift} step={0.1} max={3} onChange={onLift} />
        <Num label="float" name="Float: the height of its bob" value={float} step={0.05} max={1} onChange={onFloat} />
      </Fields>
      <p className="text-[11.5px] leading-snug text-pretty text-fg-subtle">Lift plays when the scene comes apart (hover it in Preview). Float bobs it gently.</p>
    </InspectorSection>
  )
}

function ManyProperties({ parts, group, scene, onParts, onGroupChange, onAction }: PropertiesProps & { parts: Part[]; group?: SceneGroup }) {
  const index = group ? scene.groups.indexOf(group) + 1 : 0
  const grouped = parts.some((p) => p.group)
  return (
    <div className="flex flex-col gap-5">
      <Header title={group ? `Group ${index}` : `${parts.length} parts`} detail={group ? `${parts.length} parts, moving as one` : 'Selected together'} onAction={onAction} />
      <div className="flex gap-1.5">
        {!group && (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('group')}>
            Group
            <Kbd className="ms-1">⌘G</Kbd>
          </Button>
        )}
        {grouped && (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('ungroup')}>
            Ungroup
            <Kbd className="ms-1">⇧⌘G</Kbd>
          </Button>
        )}
      </div>
      {group && (
        <Motion
          lift={group.lift}
          float={group.float}
          onLift={(lift) => onGroupChange(group.id, { lift }, `${group.id}:lift`)}
          onFloat={(float) => onGroupChange(group.id, { float }, `${group.id}:float`)}
        />
      )}
      <Look parts={parts} onParts={onParts} />
    </div>
  )
}

function SceneSettings({ scene, onScene, onTemplate }: PropertiesProps) {
  const nameId = useId()
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="truncate text-[14px] leading-5 font-semibold tracking-tight text-fg">{scene.name}</h2>
        <p className="text-[12px] leading-snug text-fg-muted">
          {scene.parts.length ? `${scene.parts.length} ${scene.parts.length === 1 ? 'part' : 'parts'}. Select one to edit it.` : 'Nothing on it yet: drag a part onto the floor.'}
        </p>
      </div>
      <InspectorSection title="Settings">
        <InspectorRow label="Name" htmlFor={nameId}>
          <Input id={nameId} value={scene.name} maxLength={40} onChange={(e) => onScene({ name: e.currentTarget.value }, 'name')} className="h-control-sm rounded-field-sm text-[12.5px]" />
        </InspectorRow>
        <InspectorSelect label="Stands on" value={scene.base} options={BASES.map((b) => ({ value: b, label: BASE_LABELS[b] }))} onChange={(base: Base) => onScene({ base }, 'base')} />
      </InspectorSection>
      <InspectorSection title="Start from">
        <ul className="grid grid-cols-2 gap-1.5">
          {TEMPLATES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onTemplate(t)}
                className="flex w-full flex-col items-start gap-0.5 rounded-lg border border-line px-2.5 py-2 text-start transition-colors yj-duration-fast ease-standard hover:border-line-strong hover:bg-hover focus-ring"
              >
                <span className="text-[12.5px] font-medium text-fg">{t.name}</span>
                <span className="line-clamp-2 text-[11px] leading-snug text-fg-muted">{t.note}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-[11.5px] leading-snug text-fg-subtle">Replaces the scene. Undo brings it back.</p>
      </InspectorSection>
    </div>
  )
}
