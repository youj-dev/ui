import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookOpenIcon, CalendarIcon, ClipboardIcon, CreditCardIcon, MessageIcon } from '@youj/icons'
import { PermissionMatrix } from './permission-matrix'
import { SAVED } from './permission-matrix/data'

const meta: Meta<typeof PermissionMatrix> = {
  title: 'Blocks/App/Permission Matrix',
  component: PermissionMatrix,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Choose what each role can see and change, one role at a time or as a grid, then review and save the changes together.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PermissionMatrix>

/** One role at a time: each area of the workspace with a "Can view / Can edit" picker. */
export const Default: Story = { name: 'Workspace roles' }

/** The whole grid at once: roles down the side, areas across, a level in each cell. */
export const Grid: Story = { args: { defaultView: 'grid' } }

/** Nothing pending: the grid as saved. */
export const UpToDate: Story = { name: 'Up to date', args: { draft: SAVED } }

/** Education: the roles of a school's portal over grades, attendance and messages. Parents read their child’s records; students’ and parents’ message access is the change waiting to be saved. */
export const SchoolPortal: Story = {
  name: 'School portal',
  args: {
    copy: { title: 'Portal access', scope: 'Fairview Middle School', shape: (roles: number, resources: number) => `${roles} roles × ${resources} areas` },
    roles: [
      { id: 'principal', name: 'Principal', detail: '1 member', locked: true, description: 'Sees and runs everything at the school.' },
      { id: 'admin', name: 'Office admin', detail: '3 members', description: 'Keeps attendance and families’ contact details up to date.' },
      { id: 'teacher', name: 'Teacher', detail: '38 members', description: 'Grades work and takes attendance for their classes.' },
      { id: 'student', name: 'Student', detail: '612 members', description: 'Sees their own grades and attendance.' },
      { id: 'parent', name: 'Parent', detail: '780 members', description: 'Follows a child’s progress and writes to teachers.' },
    ],
    resources: [
      { id: 'grades', name: 'Grades', description: 'Marks, report cards and comments', icon: BookOpenIcon },
      { id: 'attendance', name: 'Attendance', description: 'Daily presence and late arrivals', icon: CalendarIcon },
      { id: 'messages', name: 'Messages', description: 'Notes between school and home', icon: MessageIcon },
    ],
    saved: {
      principal: { grades: 'admin', attendance: 'admin', messages: 'admin' },
      admin: { grades: 'read', attendance: 'admin', messages: 'write' },
      teacher: { grades: 'write', attendance: 'write', messages: 'write' },
      student: { grades: 'read', attendance: 'read', messages: 'none' },
      parent: { grades: 'read', attendance: 'read', messages: 'write' },
    },
    draft: {
      principal: { grades: 'admin', attendance: 'admin', messages: 'admin' },
      admin: { grades: 'read', attendance: 'admin', messages: 'write' },
      teacher: { grades: 'write', attendance: 'write', messages: 'write' },
      student: { grades: 'read', attendance: 'read', messages: 'read' },
      parent: { grades: 'read', attendance: 'read', messages: 'read' },
    },
  },
}

/** Health: a clinic's staff over charts, billing and scheduling. Billing staff never see a chart, front desk can change the schedule but only read a chart's summary. */
export const ClinicRecords: Story = {
  name: 'Clinic records',
  args: {
    defaultView: 'grid',
    copy: { title: 'Record access', scope: 'Harbor Family Clinic', shape: (roles: number, resources: number) => `${roles} roles × ${resources} areas` },
    roles: [
      { id: 'manager', name: 'Practice manager', detail: '1 member', locked: true, description: 'Responsible for who can open what.' },
      { id: 'physician', name: 'Physician', detail: '6 members', description: 'Writes and signs patients’ charts.' },
      { id: 'nurse', name: 'Nurse', detail: '11 members', description: 'Records vitals and updates charts during visits.' },
      { id: 'front', name: 'Front desk', detail: '5 members', description: 'Checks patients in and books visits.' },
      { id: 'billing', name: 'Billing clerk', detail: '3 members', description: 'Sends claims and follows up on payments.' },
    ],
    resources: [
      { id: 'charts', name: 'Charts', description: 'Notes, results and prescriptions', icon: ClipboardIcon },
      { id: 'billing', name: 'Billing', description: 'Claims, invoices and balances', icon: CreditCardIcon },
      { id: 'scheduling', name: 'Scheduling', description: 'Appointments and rooms', icon: CalendarIcon },
    ],
    saved: {
      manager: { charts: 'admin', billing: 'admin', scheduling: 'admin' },
      physician: { charts: 'write', billing: 'none', scheduling: 'read' },
      nurse: { charts: 'write', billing: 'none', scheduling: 'read' },
      front: { charts: 'none', billing: 'read', scheduling: 'write' },
      billing: { charts: 'none', billing: 'write', scheduling: 'read' },
    },
    draft: {
      manager: { charts: 'admin', billing: 'admin', scheduling: 'admin' },
      physician: { charts: 'write', billing: 'read', scheduling: 'read' },
      nurse: { charts: 'write', billing: 'none', scheduling: 'write' },
      front: { charts: 'read', billing: 'read', scheduling: 'write' },
      billing: { charts: 'none', billing: 'write', scheduling: 'read' },
    },
  },
}
