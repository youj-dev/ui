import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Quadrant, type QuadrantItem } from './quadrant'

const meta: Meta<typeof Quadrant> = {
  title: 'Blocks/App/Quadrant',
  component: Quadrant,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'How two measures relate: items as bubbles split into four groups by two lines you can drag. The chips are the legend, the counts and a filter; Movement draws where each stood last period. Demo content — edit after adding.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Quadrant>

export const Default: Story = {}

/** Where each account stood in August: three champions slid into risk. */
export const Movement: Story = { args: { defaultMovement: true } }

/** At risk alone, with the list of who's in it. */
export const AtRisk: Story = { name: 'At risk', args: { defaultGroup: 'low-high', defaultMovement: true } }

export const Loading: Story = { args: { loading: true } }

export const LoadError: Story = { name: 'Error', args: { error: "The accounts couldn't be loaded.", onRetry: fn() } }

export const Empty: Story = { args: { items: [] } }

/* A product's features by reach (share of weekly users who touch it) and
 * frequency (uses a user a week), with no sizes and no last period. */
const FEATURES: QuadrantItem[] = [
  ['search', 'Search', 82, 9.4],
  ['editor', 'Editor', 91, 14.2],
  ['comments', 'Comments', 64, 6.1],
  ['share', 'Share links', 58, 2.2],
  ['export', 'Export', 41, 1.4],
  ['templates', 'Templates', 37, 3.1],
  ['automations', 'Automations', 12, 11.6],
  ['api', 'API keys', 8, 8.9],
  ['dashboards', 'Dashboards', 26, 4.8],
  ['import', 'Import', 22, 0.9],
  ['themes', 'Themes', 15, 0.6],
  ['mentions', 'Mentions', 47, 5.6],
  ['history', 'Version history', 33, 1.1],
  ['offline', 'Offline mode', 6, 2.4],
].map(([id, label, x, y]) => ({ id: id as string, label: label as string, x: x as number, y: y as number }))

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    items: FEATURES,
    x: { format: { style: 'unit', unit: 'percent', maximumFractionDigits: 0 }, domain: [0, 100] },
    y: { format: { maximumFractionDigits: 1 } },
    defaultThresholds: [40, 5],
    copy: {
      title: 'Feature adoption',
      description: (count: string) => `${count} features by reach and frequency · last 30 days`,
      x: 'Reach',
      y: 'Uses a week',
      groups: { 'high-high': 'Core', 'low-high': 'Power tools', 'high-low': 'Shallow', 'low-low': 'Unproven' },
      xValue: (value: string) => `${value} reach`,
      yValue: (value: string) => `${value} uses a week`,
      chart: 'Features by reach and frequency',
      points: 'Features',
      point: (label: string, x: string, y: string, _size: string, group: string) => `${label}: ${x} reach, ${y} uses a week. ${group}.`,
      splitX: (value: string) => `Reach split at ${value}`,
      splitY: (value: string) => `Frequency split at ${value}`,
      splitXName: 'Reach split',
      splitYName: 'Frequency split',
      all: 'All features',
      list: (group: string) => `${group}, most used first`,
      summary: (count: string, parts: string) => `${count} features. ${parts}.`,
    },
    onItemSelect: fn(),
  },
}

/* A software maker's products: across, annual revenue; up, year-over-year growth; bubbles by customers (thousands). */
const PRODUCTS: QuadrantItem[] = [
  ['ledgerly', 'Ledgerly', 48_000_000, 31, 120],
  ['pulsebeat', 'Pulsebeat', 36_000_000, 44, 85],
  ['tallyho', 'Tallyho', 29_000_000, 9, 140],
  ['fernmail', 'Fernmail', 22_000_000, 6, 210],
  ['orbit', 'Orbit CRM', 41_000_000, 18, 95],
  ['quillpad', 'Quillpad', 9_000_000, 52, 30],
  ['brindle', 'Brindle Pay', 14_000_000, 38, 42],
  ['lumenhq', 'Lumen HQ', 6_000_000, 61, 18],
  ['sablesign', 'SableSign', 11_000_000, 12, 55],
  ['marlowdocs', 'Marlow Docs', 17_000_000, 4, 160],
  ['kestrelbi', 'Kestrel BI', 8_000_000, 27, 24],
  ['tidewatch', 'Tidewatch', 5_000_000, -3, 14],
  ['cirrus', 'Cirrus Backup', 12_000_000, -6, 68],
  ['basaltvpn', 'Basalt VPN', 3_000_000, 8, 22],
].map(([id, label, x, y, size]) => ({ id: id as string, label: label as string, x: x as number, y: y as number, size: size as number }))

export const ProductPortfolio: Story = {
  name: 'Product portfolio',
  args: {
    items: PRODUCTS,
    x: { format: { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 0, minimumFractionDigits: 0 }, domain: [0, 60_000_000] },
    y: { format: { style: 'unit', unit: 'percent', maximumFractionDigits: 0 }, domain: [-20, 80] },
    defaultThresholds: [20_000_000, 15],
    copy: {
      title: 'Product portfolio',
      description: (count: string) => `${count} products by revenue and growth · fiscal 2026`,
      x: 'Annual revenue',
      y: 'Growth, year over year',
      size: 'Customers (thousands)',
      groups: { 'high-high': 'Stars', 'low-high': 'Rising', 'high-low': 'Cash cows', 'low-low': 'Question marks' },
      xValue: (value: string) => `${value} revenue`,
      yValue: (value: string) => `${value} growth`,
      sizeValue: (value: string) => `${value}K customers`,
      chart: 'Products by revenue and growth',
      points: 'Products',
      point: (label: string, x: string, y: string, size: string, group: string) => `${label}: ${x} revenue, ${y} growth${size ? `, ${size}K customers` : ''}. ${group}.`,
      splitX: (value: string) => `Revenue split at ${value}`,
      splitY: (value: string) => `Growth split at ${value}`,
      splitXName: 'Revenue split',
      splitYName: 'Growth split',
      all: 'All products',
      list: (group: string) => `${group}, fastest growing first`,
      summary: (count: string, parts: string) => `${count} products. ${parts}.`,
      loading: 'Loading products',
      empty: 'No products yet',
      emptyDescription: 'Products appear once they have revenue.',
    },
    onItemSelect: fn(),
  },
}

/* Anonymous patient groups in a clinic network: across, how many of their doses and visits they kept; up, their average risk score; bubbles by group size. */
const PATIENT_GROUPS: QuadrantItem[] = [
  ['diabetes-65', 'Type 2 diabetes, 65 and over', 74, 58, 840],
  ['diabetes-new', 'Type 2 diabetes, newly diagnosed', 88, 31, 420],
  ['hypertension', 'Hypertension, on medication', 81, 44, 1_260],
  ['heart-failure', 'Heart failure', 63, 82, 310],
  ['copd', 'COPD', 57, 76, 270],
  ['asthma-kids', 'Asthma, under 12', 79, 22, 530],
  ['post-surgery', 'Hip or knee surgery, first 30 days', 92, 49, 190],
  ['ckd', 'Chronic kidney disease', 69, 71, 240],
  ['depression', 'Depression, in therapy', 52, 54, 680],
  ['statins', 'Cholesterol, statin therapy', 85, 27, 1_480],
  ['prenatal', 'Prenatal care', 90, 36, 360],
  ['anticoag', 'Blood thinners', 71, 64, 220],
].map(([id, label, x, y, size]) => ({ id: id as string, label: label as string, x: x as number, y: y as number, size: size as number }))

export const PatientRisk: Story = {
  name: 'Patient risk',
  args: {
    items: PATIENT_GROUPS,
    x: { format: { style: 'unit', unit: 'percent', maximumFractionDigits: 0 }, domain: [40, 100] },
    y: { format: { maximumFractionDigits: 0 }, domain: [0, 100] },
    defaultThresholds: [70, 50],
    copy: {
      title: 'Patient risk',
      description: (count: string) => `${count} patient groups by adherence and risk score · last 90 days`,
      x: 'Adherence',
      y: 'Risk score',
      size: 'Patients',
      groups: { 'high-high': 'Monitor closely', 'low-high': 'Reach out now', 'high-low': 'Stable', 'low-low': 'Encourage' },
      xValue: (value: string) => `${value} adherence`,
      yValue: (value: string) => `risk ${value}`,
      sizeValue: (value: string) => `${value} patients`,
      chart: 'Patient groups by adherence and risk',
      points: 'Patient groups',
      point: (label: string, x: string, y: string, size: string, group: string) => `${label}: ${x} adherence, risk score ${y}${size ? `, ${size} patients` : ''}. ${group}.`,
      splitX: (value: string) => `Adherence split at ${value}`,
      splitY: (value: string) => `Risk split at ${value}`,
      splitXName: 'Adherence split',
      splitYName: 'Risk split',
      all: 'All groups',
      list: (group: string) => `${group}, highest risk first`,
      summary: (count: string, parts: string) => `${count} patient groups. ${parts}.`,
      loading: 'Loading patient groups',
      empty: 'No patient groups yet',
      emptyDescription: 'Groups appear once there are enough patients to report.',
    },
    onItemSelect: fn(),
  },
}

export const Standalone: Story = { args: { embedded: false } }
