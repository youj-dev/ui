export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export type ApplicationBusinessType = 'sole' | 'company' | 'partnership' | 'nonprofit'

export interface ApplicationOption {
  value: string
  label: string
  description?: string
  /** A role that holds a share of the business: it asks for a percentage, counted in the total. Only the roles list reads it. */
  share?: boolean
}

/** One person with significant control: a director, an owner, or both. */
export interface ApplicationPerson {
  name: string
  /** The `value` of one of the `roles`. */
  role: string
  /** Their share of the business, in percent, as typed. */
  share: string
}

/** Everything the application holds (the documents are files, sent alongside). */
export interface ApplicationValues {
  type: ApplicationBusinessType | ''
  name: string
  country: string
  industry: string
  registration: string
  founded: string
  website: string
  people: ApplicationPerson[]
  you: { name: string; day: string; month: string; year: string }
  declaration: boolean
}

/** What `onSubmit` receives. */
export interface ApplicationSubmission {
  values: ApplicationValues
  /** The documents that finished uploading. */
  documents: File[]
}

/** The steps an application can have; which it takes depends on the business. */
export type ApplicationStepId = 'business' | 'company' | 'people' | 'you' | 'documents' | 'review'

export const BUSINESS_TYPES: (ApplicationOption & { value: ApplicationBusinessType })[] = [
  { value: 'sole', label: 'Sole trader', description: 'You run it yourself' },
  { value: 'company', label: 'Limited company', description: 'Registered, with directors' },
  { value: 'partnership', label: 'Partnership', description: 'Two or more partners' },
  { value: 'nonprofit', label: 'Charity or non-profit', description: 'Registered as one' },
]

export const APPLICATION_COUNTRIES: ApplicationOption[] = [
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IE', label: 'Ireland' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
]

export const INDUSTRIES: ApplicationOption[] = [
  { value: 'software', label: 'Software and online services' },
  { value: 'retail', label: 'Retail and e-commerce' },
  { value: 'food', label: 'Food and hospitality' },
  { value: 'creative', label: 'Design, media and creative' },
  { value: 'consulting', label: 'Consulting and professional services' },
  { value: 'other', label: 'Something else' },
]

export const ROLES: ApplicationOption[] = [
  { value: 'director', label: 'Director' },
  { value: 'owner', label: 'Owner', share: true },
  { value: 'both', label: 'Director and owner', share: true },
]

export const EMPTY_PERSON: ApplicationPerson = { name: '', role: '', share: '' }

export const EMPTY_VALUES: ApplicationValues = {
  type: '',
  name: '',
  country: 'GB',
  industry: '',
  registration: '',
  founded: '',
  website: '',
  people: [{ ...EMPTY_PERSON }],
  you: { name: '', day: '', month: '', year: '' },
  declaration: false,
}

/** The steps this business's application takes, in order. */
export function stepsFor(type: ApplicationValues['type']): ApplicationStepId[] {
  if (type === 'sole') return ['business', 'you', 'documents', 'review']
  if (type === 'nonprofit') return ['business', 'company', 'documents', 'review']
  // A company's path, until the type says otherwise: the longest, so the Stepper only ever shrinks.
  return ['business', 'company', 'people', 'documents', 'review']
}

export const DEFAULT_COPY = {
  title: 'Open a business account',
  description: 'About ten minutes. You can save and finish later.',
  /** Each step's name, in the Stepper and over the step: short, so five fit on one line. */
  steps: {
    business: 'Business',
    company: 'Company',
    people: 'People',
    you: 'About you',
    documents: 'Documents',
    review: 'Review',
  } as Record<ApplicationStepId, string>,
  descriptions: {
    business: 'What it is and where it’s registered.',
    company: 'As the official register shows it.',
    people: 'Everyone who runs the business or owns a quarter or more of it.',
    you: 'As it appears on your ID.',
    documents: 'A clear photo or scan; we’ll check it within a day.',
    review: 'Check your answers, and change anything before you send them.',
  } as Record<ApplicationStepId, string>,
  type: 'Type of business',
  name: 'Business name',
  nameHint: 'The legal name, or your trading name as a sole trader.',
  country: 'Country of registration',
  industry: 'What it does',
  choose: 'Choose…',
  registration: 'Company number',
  registrationHint: 'From the official register, like 09446231.',
  founded: 'Year founded',
  website: 'Website',
  websitePlaceholder: 'northwind.co.uk',
  optional: 'optional',
  person: (index: number) => `Person ${index}`,
  personName: 'Full name',
  role: 'Role',
  share: 'Share',
  addPerson: 'Add a person',
  removePerson: (name: string) => `Remove ${name}`,
  /** The total of every owner's share, under the list: "75% of the business". */
  shares: (total: number) => `${total}% of the business`,
  yourName: 'Your full name',
  birth: 'Date of birth',
  birthHint: 'For example, 27 3 1985',
  day: 'Day',
  month: 'Month',
  year: 'Year',
  document: (type: ApplicationValues['type']): string => (type === 'sole' ? 'Photo ID: a passport or driver’s license' : 'Certificate of incorporation or registration'),
  documentTitle: 'Add a photo or a PDF',
  declaration: 'The information I’ve given is true and complete, and I may act for this business.',
  change: 'Change',
  changeLabel: (step: string) => `Change ${step.toLowerCase()}`,
  none: 'Not given',
  /** The problems at the top of a step, GOV.UK style. */
  problemTitle: 'There’s a problem',
  next: 'Continue',
  back: 'Back',
  submit: 'Send application',
  submitted: 'Sent',
  saveDraft: 'Save and finish later',
  /** After a save: "Saved at 14:32". */
  savedAt: (time: string) => `Saved at ${time}`,
  failedTitle: 'Your application didn’t send',
  failedDescription: 'Nothing is lost. Try again in a moment.',
  doneTitle: 'Application received',
  /** "Your reference is NW-20714." */
  reference: (id: string) => `Your reference is ${id}.`,
  nextTitle: 'What happens next',
  nextSteps: ['We check your details, usually within a working day.', 'If we need anything else, we’ll email you.', 'Your account opens and your card is on its way.'],
  // Messages, said in full under each field and in the summary.
  typeMissing: 'Choose the type of business.',
  nameMissing: 'Enter the business’s name.',
  industryMissing: 'Choose what the business does.',
  registrationMissing: 'Enter the company number.',
  registrationInvalid: 'Enter the number as it is on the register, like 09446231.',
  foundedInvalid: (max: number) => `Enter a year from 1800 to ${max}.`,
  websiteInvalid: 'Enter a website like northwind.co.uk.',
  personNameMissing: 'Enter the person’s full name.',
  roleMissing: 'Choose their role.',
  shareMissing: 'Enter their share, from 1 to 100.',
  sharesOver: (total: number) => `Shares add up to ${total}%. They can’t be more than 100%.`,
  yourNameMissing: 'Enter your full name.',
  birthMissing: (part: string) => `Date of birth must include a ${part.toLowerCase()}.`,
  birthInvalid: 'Date of birth must be a real date.',
  birthFuture: 'Date of birth must be in the past.',
  birthAge: 'You must be 18 or over to open an account.',
  documentsMissing: 'Add at least one document.',
  documentsUploading: 'Wait for the documents to finish uploading.',
  declarationMissing: 'Confirm the information is true to send it.',
}

export type MultiStepFormCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale dates and times are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
