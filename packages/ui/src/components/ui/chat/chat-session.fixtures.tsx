import { useEffect, useRef, useState } from 'react'
import { ActivityIcon } from '@youj/icons/components/youj/icons/activity'
import { GaugeIcon } from '@youj/icons/components/youj/icons/gauge'
import { LightbulbIcon } from '@youj/icons/components/youj/icons/lightbulb'
import { PlugIcon } from '@youj/icons/components/youj/icons/plug'
import { WrenchIcon } from '@youj/icons/components/youj/icons/wrench'
import { PropertyList, PropertyListItem, PropertyStatus, PropertyText } from '../property-list'
import { SegmentedMeter } from '../segmented-meter'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'
import { Spinner } from '../spinner'
import { PromptInput, type PromptStatus } from './chat-prompt-input'

/* The composer with its session details underneath, for the "Session details"
 * story and its test: a composition of the property list, the segmented meter,
 * selects and the spinner, with a pretend turn (send, stream, done). */

const LIMIT = 200_000
const SPACES = [
  { value: 'playground', label: 'Playground' },
  { value: 'staging', label: 'Staging' },
]
const MODES = [
  { value: 'ask', label: 'Ask first' },
  { value: 'auto', label: 'Auto-run' },
]
const kTokens = (n: number) => `${(n / 1000).toFixed(1)}K`

function Pick({ label, items, value, onChange }: { label: string; items: typeof SPACES; value: string; onChange: (value: string) => void }) {
  return (
    <Select items={items} value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger size="sm" variant="ghost" aria-label={label} className="shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} side="top">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function SessionComposer({ initialStatus = 'idle' }: { initialStatus?: PromptStatus }) {
  const [status, setStatus] = useState<PromptStatus>(initialStatus)
  const [used, setUsed] = useState(18_200)
  const [space, setSpace] = useState('playground')
  const [mode, setMode] = useState('ask')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const running = status !== 'idle'
  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <PromptInput
        status={status}
        placeholder="Ask about this session…"
        className="[&_[data-slot=input-group]]:shadow-none"
        onStop={() => {
          timers.current.forEach(clearTimeout)
          setStatus('idle')
        }}
        onSubmit={() => {
          setStatus('submitted')
          timers.current = [
            setTimeout(() => setStatus('streaming'), 600),
            setTimeout(() => {
              setStatus('idle')
              setUsed((n) => n + 2_400)
            }, 3_400),
          ]
        }}
      />
      <section aria-label="Session details" className="flex flex-col rounded-xl bg-well">
        <PropertyList className="px-3.5 py-1.5">
          <PropertyListItem icon={<GaugeIcon size={16} />} label="Context">
            <span className="flex w-full min-w-0 items-center gap-3">
              <span className="shrink-0 tabular-nums">
                {kTokens(used)} <span className="text-fg-muted">/ {kTokens(LIMIT).replace('.0', '')} tokens</span>
              </span>
              <SegmentedMeter
                aria-label="Context used"
                value={used}
                max={LIMIT}
                segments={20}
                showValue={false}
                thresholds={[{ value: LIMIT * 0.8, tone: 'warning' }]}
                className="min-w-16 flex-1 [&_[data-slot=segmented-meter-track]]:h-2"
              />
            </span>
          </PropertyListItem>
          <PropertyListItem icon={<LightbulbIcon size={16} />} label="Reasoning">
            <PropertyText>Medium</PropertyText>
          </PropertyListItem>
          <PropertyListItem icon={<WrenchIcon size={16} />} label="Tools">
            <PropertyText>Read, Edit, Bash +3</PropertyText>
          </PropertyListItem>
          <PropertyListItem icon={<PlugIcon size={16} />} label="MCP & Skills">
            <PropertyText>2 servers, 4 skills</PropertyText>
          </PropertyListItem>
          <PropertyListItem icon={<ActivityIcon size={16} />} label="Status">
            <PropertyStatus tone={running ? 'success' : 'neutral'}>{running ? 'Running' : 'Idle'}</PropertyStatus>
          </PropertyListItem>
        </PropertyList>
        <div className="flex items-center gap-1 border-t border-line px-2 py-1.5">
          <Pick label="Workspace" items={SPACES} value={space} onChange={setSpace} />
          <Pick label="Permissions" items={MODES} value={mode} onChange={setMode} />
          <span className="ms-auto flex h-control-sm items-center px-2">{running ? <Spinner label="Working" size={16} /> : null}</span>
        </div>
      </section>
    </div>
  )
}
