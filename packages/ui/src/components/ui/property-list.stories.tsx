import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import {
  BanknoteIcon,
  BarChartIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarCheckIcon,
  CircleDashedIcon,
  CircleUserIcon,
  FlagIcon,
  HashIcon,
  UserCheckIcon,
} from '@youj/icons'
import {
  PropertyAge,
  PropertyDate,
  PropertyList,
  PropertyListItem,
  PropertyMoney,
  PropertyPerson,
  PropertyProgress,
  PropertyStatus,
  PropertyTag,
  PropertyText,
} from './property-list'

const meta: Meta<typeof PropertyList> = {
  title: 'UI/Data/PropertyList',
  component: PropertyList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "A record's properties as rows of icon, label and value: a description list (`dl`, `dt`, `dd`), with a fixed label column and values that truncate. The value is any node, or a helper for the common kinds: PropertyPerson, PropertyTag, PropertyStatus, PropertyProgress, PropertyDate, PropertyMoney, PropertyAge and PropertyText, formatted in the app's locale. A row with `onEdit` shows a pencil while hovered or focused (always on touch), a real button named \"Edit <label>\".",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PropertyList>

const NOW = Date.UTC(2026, 9, 5, 9, 30)

/** A deal's properties, every value kind, each row editable. */
export const Hero: Story = {
  render: () => {
    const edit = fn()
    return (
      <div className="w-[26rem] rounded-xl border border-line bg-overlay p-5 shadow-md">
        <PropertyList>
          <PropertyListItem icon={<CircleUserIcon />} label="Owner" onEdit={edit}>
            <PropertyPerson name="Noor Haddad" />
          </PropertyListItem>
          <PropertyListItem icon={<BriefcaseIcon />} label="Deal" onEdit={edit}>
            <PropertyText>Inference platform expansion for the research team</PropertyText>
          </PropertyListItem>
          <PropertyListItem icon={<BuildingIcon />} label="Industry" onEdit={edit}>
            <PropertyTag>AI</PropertyTag>
          </PropertyListItem>
          <PropertyListItem icon={<CircleDashedIcon />} label="Stage" onEdit={edit}>
            <PropertyStatus tone="warning">Proposal</PropertyStatus>
          </PropertyListItem>
          <PropertyListItem icon={<BarChartIcon />} label="Probability" onEdit={edit}>
            <PropertyProgress value={62} />
          </PropertyListItem>
          <PropertyListItem icon={<CalendarCheckIcon />} label="Closes" onEdit={edit}>
            <PropertyDate value="2026-11-30" />
          </PropertyListItem>
          <PropertyListItem icon={<HashIcon />} label="Age">
            <PropertyAge since={NOW - 12 * 86_400_000} now={NOW} />
          </PropertyListItem>
          <PropertyListItem icon={<FlagIcon />} label="Next step" onEdit={edit}>
            <PropertyDate value="2026-10-14" />
          </PropertyListItem>
          <PropertyListItem icon={<BanknoteIcon />} label="Value" onEdit={edit}>
            <PropertyMoney value={324_000} />
          </PropertyListItem>
          <PropertyListItem icon={<UserCheckIcon />} label="Last edited by">
            <PropertyPerson name="Tomás Reyes" />
          </PropertyListItem>
        </PropertyList>
      </div>
    )
  },
}

/** Any node is a value; rows without `onEdit` are read-only. A narrow list (under 20rem) stacks each label above its value. */
export const Narrow: Story = {
  render: () => (
    <div className="w-72 rounded-xl border border-line bg-overlay p-4">
      <PropertyList>
        <PropertyListItem icon={<CircleUserIcon />} label="Assignee">
          <PropertyPerson name="Mei Tanaka" />
        </PropertyListItem>
        <PropertyListItem icon={<CircleDashedIcon />} label="Status">
          <PropertyStatus tone="success">Shipped</PropertyStatus>
        </PropertyListItem>
        <PropertyListItem icon={<BriefcaseIcon />} label="Release">
          <span className="font-mono text-ui-sm">v4.12.0-rc.3</span>
        </PropertyListItem>
      </PropertyList>
    </div>
  ),
}

/** `stack={false}` keeps each label beside its value in the same narrow panel: short values, with the label column narrowed through `--property-label-width`. */
export const SideBySide: Story = {
  render: () => (
    <div className="w-72 rounded-xl border border-line bg-overlay p-4">
      <PropertyList stack={false} className="[--property-label-width:6.5rem]">
        <PropertyListItem icon={<CircleUserIcon />} label="Assignee">
          <PropertyPerson name="Mei Tanaka" />
        </PropertyListItem>
        <PropertyListItem icon={<CircleDashedIcon />} label="Status">
          <PropertyStatus tone="success">Shipped</PropertyStatus>
        </PropertyListItem>
        <PropertyListItem icon={<BriefcaseIcon />} label="Release">
          <span className="font-mono text-ui-sm">v4.12.0-rc.3</span>
        </PropertyListItem>
      </PropertyList>
    </div>
  ),
}

/** Formatting follows the locale: a German page writes its money and dates the German way. */
export const Localized: Story = {
  render: () => (
    <div className="w-[26rem] rounded-xl border border-line bg-overlay p-5">
      <PropertyList>
        <PropertyListItem icon={<BanknoteIcon />} label="Wert">
          <PropertyMoney value={48_250.5} currency="EUR" locale="de-DE" />
        </PropertyListItem>
        <PropertyListItem icon={<CalendarCheckIcon />} label="Abschluss">
          <PropertyDate value="2026-11-30" locale="de-DE" />
        </PropertyListItem>
        <PropertyListItem icon={<HashIcon />} label="Alter">
          <PropertyAge since={NOW - 95 * 86_400_000} now={NOW} locale="de-DE" />
        </PropertyListItem>
      </PropertyList>
    </div>
  ),
}
