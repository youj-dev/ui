import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { basalt } from '@youj/core'
import { PublicStatus } from './public-status'

const meta: Meta<typeof PublicStatus> = {
  title: 'Blocks/App/Public status',
  component: PublicStatus,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Keep your customers informed with a public status page for the same services, their uptime and incident updates.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PublicStatus>

export const Operational: Story = {}

export const Incident: Story = { args: { incident: true } }

const MIN = 60_000
const NOW = Date.UTC(2026, 8, 28, 9, 30)
const day = (ago: number) => new Date(Date.UTC(2026, 8, 28 - ago)).toISOString().slice(0, 10)
const days = (down: Record<number, number> = {}, notes: Record<number, string> = {}) =>
  Array.from({ length: 90 }, (_, i) => {
    const ago = 89 - i
    const minutes = down[ago] ?? 0
    return { date: day(ago), uptime: 1 - minutes / 1440, downtimeMinutes: minutes, incidents: minutes > 5 ? 1 : 0, ...(notes[ago] ? { note: notes[ago] } : null) }
  })

/** A freight carrier's portal: its own services, sections, incident, response times and Spanish strings. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    now: NOW,
    services: [
      { id: 'tracking', name: 'tracking-api', days: days({ 12: 34 }, { 12: 'Carrier feed timeouts' }) },
      { id: 'booking', name: 'booking-web', days: days() },
      { id: 'edi', name: 'edi-gateway', days: days({ 0: 41, 30: 18 }, { 0: 'EDI 214 messages delayed', 30: 'Partner certificate expired' }) },
    ],
    groups: [
      { name: 'Envíos', services: ['tracking', 'booking'] },
      { name: 'Integraciones', services: ['edi'] },
    ],
    incident: {
      title: 'Retrasos en mensajes EDI',
      service: 'edi-gateway',
      startedAt: NOW - 41 * MIN,
      summary: 'Los avisos de estado EDI llegan con retraso. El resto funciona.',
      updates: [
        { id: 'b', type: 'identified', title: 'Una cola de reintentos saturada en el gateway EDI. Ampliando consumidores.', time: NOW - 12 * MIN },
        { id: 'a', type: 'investigating', title: 'Investigamos retrasos en los mensajes EDI 214.', time: NOW - 41 * MIN },
      ],
    },
    responseTimes: { '24h': [210, 220, 205, 240, 380, 420, 300, 230, 215], '7d': [200, 210, 230, 215, 205, 220, 210], '30d': [] },
    feedUrl: 'https://status.freightline.example/feed.xml',
    historyHref: '/estado/historial',
    locale: 'es-ES',
    brand: { name: 'Freightline' },
    copy: {
      product: 'Estado',
      heading: 'Estado del sistema de Freightline',
      operational: 'Todos los sistemas operativos',
      partial: 'Interrupción parcial',
      updated: 'Actualizado hace 1 min',
      affects: 'Afecta a',
      started: (m) => `Comenzó hace ${m} minutos`,
      updateTypes: { investigating: 'Investigando', identified: 'Identificado', monitoring: 'Vigilando', resolved: 'Resuelto' },
      services: 'Servicios',
      pastIncidents: 'Incidentes anteriores',
      noResponseTimes: 'Sin datos para este periodo.',
      subscribe: 'Suscribirse',
      footer: '© 2026 Freightline',
      history: 'Historial de incidentes',
    },
    onSubscribe: fn(),
    onSaveWebhook: fn(),
    onRangeChange: fn(),
  },
}
