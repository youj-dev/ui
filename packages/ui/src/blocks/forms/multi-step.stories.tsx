import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MultiStepForm } from './multi-step'

const meta: Meta<typeof MultiStepForm> = {
  title: 'Blocks/Forms/Multi Step',
  component: MultiStepForm,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A multi-step application whose steps follow the answers: a summary of problems at the top of a step, people added as cards, save and finish later, and Check your answers with a Change for each step before it’s sent.',
      },
    },
  },
  args: { now: new Date(2026, 9, 10) },
}
export default meta
type Story = StoryObj<typeof MultiStepForm>

export const Default: Story = { name: 'Job application' }

/** Its own page: a centered canvas and an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** A saved draft from a limited company, resumed: it opens on the people in control. */
export const Resumed: Story = {
  args: {
    defaultValue: {
      type: 'company',
      name: 'Northwind Studio Ltd',
      country: 'GB',
      industry: 'software',
      registration: '09446231',
      founded: '2019',
      website: 'northwind.co.uk',
      people: [
        { name: 'Ada Lovelace', role: 'both', share: '60' },
        { name: 'Charles Babbage', role: 'owner', share: '' },
      ],
    },
  },
}

/** Your lists and copy, a sole trader’s path, and the application sent through `onSubmit`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    defaultValue: { type: 'sole', name: 'Fernhill Coffee', industry: 'food' },
    industries: [
      { value: 'food', label: 'Food and drink' },
      { value: 'retail', label: 'Shops and markets' },
    ],
    countries: [{ value: 'GB', label: 'United Kingdom' }],
    copy: { title: 'Become a Fernhill stockist', description: 'Five minutes, and we’ll call within a week.' },
    onSaveDraft: fn(),
    onSubmit: fn(async () => 'FH-STK-0042'),
    onValueChange: fn(),
  },
}

/** An education form from the same props: its own steps, lists and wording, and references without shares. */
export const ScholarshipApplication: Story = {
  name: 'Scholarship application',
  args: {
    types: [
      { value: 'company', label: 'Undergraduate', description: 'Studying for a first degree' },
      { value: 'partnership', label: 'Transfer student', description: 'Moving from another college' },
    ],
    countries: [
      { value: 'US', label: 'United States' },
      { value: 'CA', label: 'Canada' },
    ],
    industries: [
      { value: 'engineering', label: 'Engineering and computing' },
      { value: 'health', label: 'Health and life sciences' },
      { value: 'arts', label: 'Arts and humanities' },
      { value: 'education', label: 'Education' },
      { value: 'other', label: 'Something else' },
    ],
    roles: [
      { value: 'teacher', label: 'Teacher' },
      { value: 'counselor', label: 'Counselor' },
      { value: 'coach', label: 'Coach or mentor' },
    ],
    maxPeople: 3,
    copy: {
      title: 'Hartwell Foundation Scholarship',
      description: 'About fifteen minutes. Applications close March 1.',
      steps: { business: 'Applicant', company: 'School', people: 'Letters', you: 'About you', documents: 'Files', review: 'Review' },
      descriptions: {
        business: 'Who you are and what you plan to study.',
        company: 'Where you study now.',
        people: 'Up to three people who can speak for you.',
        you: 'As it appears on your ID.',
        documents: 'A clear photo or scan; the committee reads every page.',
        review: 'Check your answers, and change anything before you send them.',
      },
      type: 'Student type',
      name: 'Full name',
      nameHint: 'As it appears on your school records.',
      country: 'Country of residence',
      industry: 'Intended field of study',
      typeMissing: 'Choose your student type.',
      nameMissing: 'Enter your full name.',
      industryMissing: 'Choose your intended field of study.',
      registration: 'Student ID',
      registrationHint: 'On your school ID card, like 20418835.',
      registrationMissing: 'Enter your student ID.',
      registrationInvalid: 'Enter the ID as it is on your card, like 20418835.',
      founded: 'Year you started at your school',
      website: 'School website',
      websitePlaceholder: 'lincolnhigh.org',
      websiteInvalid: 'Enter a website like lincolnhigh.org.',
      person: (index: number) => `Reference ${index}`,
      personName: 'Their full name',
      role: 'How they know you',
      addPerson: 'Add a reference',
      removePerson: (name: string) => `Remove ${name}`,
      personNameMissing: 'Enter the reference’s full name.',
      roleMissing: 'Choose how they know you.',
      document: () => 'Transcript and a one-page essay',
      declaration: 'Everything I’ve written is my own, and I agree to the scholarship rules.',
      saveDraft: 'Save and finish later',
      submit: 'Submit application',
      failedTitle: 'Your application didn’t send',
      doneTitle: 'Application received',
      reference: (id: string) => `Your confirmation number is ${id}.`,
      nextTitle: 'What happens next',
      nextSteps: ['The committee reads every application in April.', 'We’ll email your references for a short note.', 'Winners are announced by May 15.'],
      declarationMissing: 'Confirm the application is your own to submit it.',
    },
  },
}
