import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { illustrations } from '@youj/illustrations'
import { EmptyStates } from './empty-states'

const meta: Meta<typeof EmptyStates> = {
  title: 'Blocks/App/Empty states',
  component: EmptyStates,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment', illustration: true },
    docs: {
      description: {
        component:
          'Help your users take the next step when a page has no content, no results or no connection.',
      },
    },
  },
  argTypes: { illustration: { control: 'select', options: illustrations.map((i) => i.id) } },
}
export default meta
type Story = StoryObj<typeof EmptyStates>

export const Gallery: Story = {}

/** `illustration={null}`: each state's icon on its fanned plates instead of a scene, for tighter spaces. */
export const Icons: Story = { args: { illustration: null } }

/** Your product's words, query and actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    query: 'orders > 500',
    switchHref: '/workspaces',
    onCreate: fn(),
    onImport: fn(),
    onClear: fn(),
    onRequest: fn(),
    onRetry: fn(),
    copy: {
      galleryTitle: 'Quarry: empty states',
      galleryDescription: 'What a data team sees before the first pipeline, after a miss, without a role and off the network.',
      projectsTitle: 'No pipelines yet',
      projectsDescription: 'Pipelines move rows from your sources into the warehouse on a schedule.',
      newProject: 'New pipeline',
      importProject: 'Import from dbt',
      resultsTitle: (query) => `No tables match ${query}`,
      accessDescription: 'Cost reports are visible to data owners. Ask one for access, or ',
    },
  },
}

/** A recipe app's words for the same four moments: no recipes, a missed search, a private cookbook, no connection. */
export const RecipeApp: Story = {
  name: 'Recipe app',
  args: {
    query: 'lemon tart',
    switchHref: '/cookbooks',
    onCreate: fn(),
    onImport: fn(),
    onClear: fn(),
    onRequest: fn(),
    onRetry: fn(),
    copy: {
      galleryTitle: 'Pantry: empty states',
      galleryDescription: 'What a home cook sees before the first recipe, after a miss, in a private cookbook and without Wi-Fi.',
      projectsTitle: 'No recipes yet',
      projectsDescription: 'Recipes hold your ingredients, steps and notes. Write one from scratch or import it from a link.',
      newProject: 'New recipe',
      importProject: 'Import from a link',
      resultsTitle: (query) => `No recipes match “${query}”`,
      resultsDescription: 'Try fewer ingredients, check the spelling, or clear the filters to browse everything.',
      accessTitle: 'This cookbook is private',
      accessDescription: 'Only its members can see these recipes. Ask the owner to invite you, or ',
      switchWorkspace: 'switch cookbook',
      requestAccess: 'Request an invite',
      requested: 'Invite requested',
      offlineDescription: 'Saved recipes stay on this device, so you can still cook. New ones sync when you reconnect.',
    },
  },
}
