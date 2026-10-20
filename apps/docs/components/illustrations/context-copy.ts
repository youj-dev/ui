import type { SceneEntry } from './catalog'

/* The screen each scene is shown in on the hero's stage (an app's empty state, an onboarding dialog over the app, a
 * website's hero: ./context draws them) and the words it carries. Which one, and what it says, comes from the scene's category; a
 * few scenes, the classic empty and lifecycle states, have words of their own. Plain data, so the hero can name what
 * the stage shows (contextLabel) before the screens' own code has arrived. */

export type ContextKind = 'empty' | 'onboarding' | 'hero'

export interface ContextCopy {
  kind: ContextKind
  /** The window's title (empty), the step (onboarding), or the eyebrow over the headline (hero). */
  title: string
  heading: string
  body: string
  primary: string
  secondary: string
}

const empty = (title: string, heading: string, body: string, primary: string, secondary: string): ContextCopy => ({ kind: 'empty', title, heading, body, primary, secondary })
const step = (title: string, heading: string, body: string, primary: string, secondary: string): ContextCopy => ({ kind: 'onboarding', title, heading, body, primary, secondary })
const hero = (title: string, heading: string, body: string, primary: string, secondary: string): ContextCopy => ({ kind: 'hero', title, heading, body, primary, secondary })

/** The screen each category's scenes are shown in. */
const BY_CATEGORY: Record<string, ContextCopy> = {
  data: empty('Data sources', 'No data sources yet', 'Connect a database or upload a file to start building reports.', 'Connect source', 'Upload CSV'),
  infrastructure: empty('Services', 'No services yet', 'Deploy a service from a repository or an image. It’s live in under a minute.', 'New service', 'Read the guide'),
  app: empty('Workspace', 'Nothing here yet', 'Items you create or share with your team show up here.', 'Create', 'Import'),
  lifecycle: empty('Projects', 'No projects yet', 'Projects hold your deployments, domains and settings. Start one from scratch.', 'New project', 'Import'),
  commerce: empty('Orders', 'No orders yet', 'When customers check out, their orders show up here with status and tracking.', 'Create order', 'Import'),
  finance: empty('Transactions', 'No transactions yet', 'Connect a bank account to see payments, invoices and balances in one place.', 'Connect account', 'Add manually'),
  health: step('Step 1 of 3', 'Set your daily goals', 'Pick what you want to track, and we’ll build a plan around your week.', 'Continue', 'Skip'),
  education: step('Step 2 of 4', 'Pick your first course', 'Learn at your own pace, with short lessons and a quiz at the end of each.', 'Browse courses', 'Skip'),
  travel: hero('Summer trips', 'Your next trip starts here', 'Flights, stays and day plans in one place. Book in minutes, change plans for free.', 'Plan a trip', 'See deals'),
  food: hero('Open daily', 'Fresh, every morning', 'Order ahead for pickup or delivery, and skip the line on your way in.', 'Order now', 'See the menu'),
  media: empty('Library', 'Your library is empty', 'Upload photos, music or video, or import a folder to get started.', 'Upload files', 'Import folder'),
  social: empty('Messages', 'No conversations yet', 'Start a conversation with your team, or invite people to join you.', 'New message', 'Invite people'),
  home: hero('Home & garden', 'Make yourself at home', 'Everything for the house and the garden, delivered to your door.', 'Shop home', 'Gift ideas'),
  work: empty('Tasks', 'No tasks today', 'Add a task, or turn a message into one. Your week is wide open.', 'New task', 'Import'),
  sports: step('Step 1 of 3', 'Build your training plan', 'Tell us how often you train, and we’ll pace each week to match.', 'Get started', 'Skip'),
  play: hero('Game night', 'Play together, anywhere', 'Invite friends to a room and pick a game. No downloads, no sign-up.', 'Start a game', 'How it works'),
  events: hero('Live this summer', 'Tickets on sale now', 'Get your seats before they’re gone. Members get early access and free changes.', 'Get tickets', 'See the lineup'),
  pets: step('Step 1 of 2', 'Add your pet', 'Their name and breed set up reminders for vet visits and feeding times.', 'Add pet', 'Later'),
  weather: hero('Forecast', 'Know before you go', 'Hour-by-hour forecasts and alerts for everywhere you’re headed.', 'Get the app', 'See today'),
  nature: hero('Climate', 'Every choice adds up', 'Track your footprint, and see what each small change saves in a year.', 'Get started', 'Learn more'),
  energy: step('Step 2 of 3', 'Connect your meter', 'Link your meter to see live usage, and get a nudge when prices drop.', 'Connect', 'Skip'),
  transport: hero('Get around', 'Every ride in one app', 'Trains, buses, bikes and scooters, with one ticket and live times.', 'Plan a route', 'See passes'),
  places: hero('In town', 'Find what’s near you', 'Opening hours, directions and the quiet times for every place nearby.', 'Explore the map', 'Saved places'),
  outdoors: hero('Adventure', 'Go further this weekend', 'Trails, campsites and gear lists for your next trip out.', 'Find a trail', 'Gear lists'),
  science: empty('Experiments', 'No experiments yet', 'Set up an experiment to log samples, results and notes in one place.', 'New experiment', 'Use a template'),
  security: step('Step 2 of 3', 'Protect your account', 'Turn on two-factor sign-in, so a stolen password is never enough.', 'Turn on', 'Skip'),
  devices: step('Step 1 of 3', 'Pair your device', 'Turn it on and hold it near your phone. We’ll find it in a few seconds.', 'Start pairing', 'Need help?'),
  business: empty('Deals', 'No deals yet', 'Add a deal to track its stage, value and next step with your team.', 'New deal', 'Import CSV'),
}

/** The scenes made for one screen: the app's own empty states and the lifecycle's moments. */
const BY_SCENE: Record<string, ContextCopy> = {
  analytics: empty('Reports', 'No reports yet', 'Reports show traffic, revenue and growth once your first events arrive.', 'Create report', 'Send a test event'),
  calendar: empty('Schedule', 'Nothing scheduled this week', 'Connect a calendar to see your week here, or book time with your team.', 'Connect calendar', 'New event'),
  documents: empty('Documents', 'No documents yet', 'Write a doc from scratch, or import one from your drive.', 'New document', 'Import'),
  mail: empty('Inbox', 'Inbox zero', 'You’ve read everything. New mail lands here as it arrives.', 'Compose', 'Refresh'),
  notifications: empty('Notifications', 'You’re all caught up', 'We’ll let you know here when something needs your attention.', 'Settings', 'Mark all read'),
  search: empty('Search', 'No results for “invoices”', 'Check the spelling, try a broader term, or clear the filters.', 'Clear filters', 'Search everything'),
  empty: empty('Projects', 'No projects yet', 'Projects hold your deployments, domains and settings. Start one from scratch.', 'New project', 'Import from Git'),
  'not-found': hero('Error 404', 'This page wandered off', 'The link may be broken, or the page may have moved. Let’s get you back.', 'Back home', 'Search the site'),
  deploy: step('Step 3 of 3', 'Ready for launch', 'Your project builds and passes its checks. Ship it to production when you’re ready.', 'Deploy now', 'Later'),
  security: step('Step 2 of 3', 'Protect your account', 'Turn on two-factor sign-in, so a stolen password is never enough.', 'Turn on', 'Skip'),
  success: step('All done', 'You’re all set', 'Your workspace is ready. Invite your team, or start your first project.', 'Go to dashboard', 'Invite team'),
  team: step('Step 2 of 3', 'Invite your team', 'Projects go faster together. Add teammates by email, or share a link.', 'Send invites', 'Skip for now'),
}

const FALLBACK = BY_CATEGORY.app!

/** The screen a scene is shown in, and its words. */
export const contextFor = (scene: Pick<SceneEntry, 'id' | 'category'>): ContextCopy => BY_SCENE[scene.id] ?? BY_CATEGORY[scene.category] ?? FALLBACK

const KIND_NAME: Record<ContextKind, string> = { empty: 'an app’s empty state', onboarding: 'an onboarding dialog', hero: 'a website’s hero' }

/** What the stage shows, in words: `Coffee in a website’s hero: Fresh, every morning.` */
export const contextLabel = (name: string, copy: ContextCopy) => `${name} in ${KIND_NAME[copy.kind]}: ${copy.heading}.`
