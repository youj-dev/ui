import type { Meta, StoryObj } from '@storybook/react-vite'
import { StagePipeline } from './stage-pipeline'
import { StagePipelineRunTiming } from './stage-pipeline/run-timing'
import { FAILING_STAGES, type StagePipelineRun, type StagePipelineScript } from './stage-pipeline/data'

const meta: Meta<typeof StagePipeline> = {
  title: 'Blocks/App/Stage Pipeline',
  component: StagePipeline,
  // The gallery's picture: the demo run, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Follow a deployment from build to release with stage progress and logs you can pause to inspect.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StagePipeline>

/** A service going to production: build, test and deploy, with Promote waiting on the last stage. */
export const Default: Story = { name: 'Deploy' }

const BATCH: StagePipelineRun = {
  id: '3107',
  name: 'Rye sourdough',
  target: 'Retail route 4',
  source: 'Line 2',
  revision: 'L3107',
  summary: '480 rounds for the morning delivery',
  author: 'dana',
  runner: 'Plant 2',
}

const BATCH_STAGES: StagePipelineScript[] = [
  {
    id: 'mix',
    name: 'Mix',
    estimate: 45_000,
    lines: [
      { text: 'Flour 265 lb, water 185 lb, starter 40 lb weighed' },
      { text: 'Mixer 1 started, spiral speed 1' },
      { text: 'Dough at 75 °F, target 75 °F' },
      { text: 'Autolyse of 20 min complete' },
      { text: 'Salt added, speed 2 for 4 min' },
      { text: 'Dough rested for 40 min' },
      { text: 'Mix finished, 480 pieces scaled', level: 'ok' },
    ],
  },
  {
    id: 'bake',
    name: 'Bake',
    estimate: 64_000,
    lines: [
      { text: 'Oven 2 preheated to 455 °F' },
      { text: 'Steam on, loaded 120 rounds' },
      { text: 'Core probe 1 at 160 °F' },
      { text: 'Crust still pale, holding' },
      { text: 'Core probe 2 at 190 °F' },
      { text: 'Rack 3 running 10 °F hot', level: 'warn' },
      { text: 'Pulled rack 1, color on target' },
      { text: 'Pulled rack 2, color on target' },
      { text: 'All racks out: 478 good, 2 culled', level: 'ok' },
    ],
  },
  {
    id: 'cool',
    name: 'Cool',
    estimate: 30_000,
    lines: [
      { text: 'Racks moved to the cooling room' },
      { text: 'Surface at 105 °F' },
      { text: 'Surface at 85 °F' },
      { text: 'Core at 78 °F, within target', level: 'ok' },
    ],
  },
  {
    id: 'pack',
    name: 'Pack',
    estimate: 40_000,
    lines: [
      { text: 'Film changed on bagger 3' },
      { text: 'Bag weight 28 oz, tolerance 0.2 oz' },
      { text: 'Metal check passed on 478 of 478' },
      { text: 'Lot L3107 label applied' },
      { text: '478 loaves packed in 40 trays', level: 'ok' },
    ],
  },
  {
    id: 'ship',
    name: 'Ship',
    estimate: 25_000,
    lines: [
      { text: 'Trays staged at dock 2' },
      { text: 'Route 4 truck loaded' },
      { text: 'Cold chain log attached' },
      { text: 'Staged at the dock, waiting for sign-off', level: 'ok' },
    ],
  },
]

/** Manufacturing: a bakery batch through mix, bake, cool, pack and ship. The lines are the floor log, and Promote reads Release batch. */
export const BatchProduction: Story = {
  name: 'Batch production',
  args: {
    run: BATCH,
    stages: BATCH_STAGES,
    copy: {
      title: (name: string) => name,
      subtitle: (run: string, target: string) => `Batch ${run} · ${target}`,
      more: 'More batch actions',
      rerun: 'Restart batch',
      copyRun: 'Copy batch ID',
      copied: 'Batch ID copied',
      state: { running: 'In progress', passed: 'Ready to release', failed: 'Held', promoted: 'Released', rolledBack: 'Recalled' },
      revision: 'Lot',
      source: 'Line',
      log: (stage: string) => `${stage} floor log`,
      runner: (runner: string) => runner,
      promote: 'Release batch',
      promoteAfter: (stage: string) => `Unlocks when ${stage.toLowerCase()} is done`,
      promoteBlocked: 'Clear the held stage to release',
      promoting: 'Releasing…',
      promoted: 'Released',
      rollBack: 'Recall',
      rollingBack: 'Recalling…',
      rolledBack: 'Recalled',
      announcePromoted: 'Batch released to retail',
      announceRolledBack: 'Batch recalled',
      queuedLog: 'Waits for the stages before it.',
      skippedLog: 'Skipped: a stage before it was held.',
    },
  },
}

const STORY: StagePipelineRun = {
  id: '2481',
  name: 'Where the arts money went',
  target: 'Home page',
  source: 'Features desk',
  revision: 'v3',
  summary: 'The city’s $4.2M arts budget, line by line',
  author: 'ines',
  runner: 'CMS',
}

const STORY_STAGES: StagePipelineScript[] = [
  {
    id: 'draft',
    name: 'Draft',
    estimate: 90_000,
    lines: [
      { text: 'Pitch accepted by the features desk' },
      { text: 'First draft filed, 1,840 words' },
      { text: 'Photos requested from the archive' },
      { text: 'Three sources confirmed on the record' },
      { text: 'Draft complete', level: 'ok' },
    ],
  },
  {
    id: 'edit',
    name: 'Edit',
    estimate: 64_000,
    lines: [
      { text: 'Structure edit: lede moved to paragraph two' },
      { text: 'Cut 220 words from the middle' },
      { text: 'Four headline options written' },
      { text: 'Fact check: grant total corrected to $4.2M' },
      { text: 'Quote from the mayor needs a second source', level: 'warn' },
      { text: 'Second source confirmed' },
      { text: 'Style pass on numbers and dates' },
      { text: 'Copy edit finished', level: 'ok' },
    ],
  },
  {
    id: 'legal',
    name: 'Legal',
    estimate: 40_000,
    lines: [
      { text: 'Libel read: no issues' },
      { text: 'Photo rights cleared for 2 of 3', level: 'warn' },
      { text: 'Third photo swapped for a licensed one' },
      { text: 'Quote approval received', level: 'ok' },
    ],
  },
  {
    id: 'layout',
    name: 'Layout',
    estimate: 35_000,
    lines: [
      { text: 'Chart placed after paragraph six' },
      { text: 'Pull quote set in the margin' },
      { text: 'Mobile preview checked' },
      { text: 'Layout approved', level: 'ok' },
    ],
  },
  {
    id: 'publish',
    name: 'Publish',
    estimate: 20_000,
    lines: [
      { text: 'Scheduled for 7:00 AM' },
      { text: 'Newsletter slot reserved' },
      { text: 'Ready on the home page, waiting for the editor', level: 'ok' },
    ],
  },
]

/** Media: an article through draft, edit, legal, layout and publish. The lines are editors' notes, and Promote reads Publish. */
export const ArticlePublishing: Story = {
  name: 'Article publishing',
  args: {
    run: STORY,
    stages: STORY_STAGES,
    copy: {
      title: (name: string) => name,
      subtitle: (run: string, target: string) => `Story #${run} · ${target}`,
      more: 'More story actions',
      rerun: 'Restart workflow',
      copyRun: 'Copy story ID',
      copied: 'Story ID copied',
      state: { running: 'In review', passed: 'Ready to publish', failed: 'Sent back', promoted: 'Live', rolledBack: 'Unpublished' },
      revision: 'Version',
      source: 'Desk',
      log: (stage: string) => `${stage} notes`,
      runner: (runner: string) => `in ${runner}`,
      promote: 'Publish',
      promoteAfter: (stage: string) => `Unlocks when ${stage.toLowerCase()} is done`,
      promoteBlocked: 'Resolve the editor’s note to publish',
      promoting: 'Publishing…',
      promoted: 'Published',
      rollBack: 'Unpublish',
      rollingBack: 'Unpublishing…',
      rolledBack: 'Unpublished',
      announcePromoted: 'Story published to the home page',
      announceRolledBack: 'Story unpublished',
      queuedLog: 'Waits for the stages before it.',
      skippedLog: 'Skipped: a stage before it was sent back.',
    },
  },
}

/** A test breaks the build: the rail stops at it in the danger tone, deploy is skipped, and Promote stays off. */
export const Failing: Story = { args: { stages: FAILING_STAGES } }

/** A finished run read as time: steps grouped as Build and Deploy with when each started and how long it took, a timing strip across the top, the earlier time as a longer ghost bar where a step got faster (and the overshoot in danger where it got slower), a skipped step, and the result line. */
export const RunTiming: Story = {
  name: 'Run timing',
  parameters: { layout: 'centered' },
  render: ({ theme }) => <StagePipelineRunTiming theme={theme} result={{ location: 'checkout.example.dev' }} />,
}
