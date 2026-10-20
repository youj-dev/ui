/* Sample accounts for the Kite finance example. Times are relative to the load. */

export type Category = 'groceries' | 'dining' | 'transport' | 'shopping' | 'bills' | 'income' | 'transfer'
export type Period = 'week' | 'month' | 'year'

export interface Txn {
  id: string
  merchant: string
  category: Category
  /** Negative is money out. */
  amount: number
  time: number
}

export interface PaymentCard {
  id: string
  name: string
  last4: string
  balance: number
  kind: 'debit' | 'credit' | 'vault'
  expires: string
}

export interface Payee {
  id: string
  name: string
  handle: string
}

export const CATEGORY_LABEL: Record<Category, string> = {
  groceries: 'Groceries',
  dining: 'Dining',
  transport: 'Transport',
  shopping: 'Shopping',
  bills: 'Bills',
  income: 'Income',
  transfer: 'Transfer',
}

export const CARDS: PaymentCard[] = [
  { id: 'everyday', name: 'Everyday', last4: '4821', balance: 8_412.56, kind: 'debit', expires: '09/29' },
  { id: 'travel', name: 'Travel credit', last4: '0937', balance: 1_265.1, kind: 'credit', expires: '03/28' },
  { id: 'vault', name: 'Rainy-day vault', last4: '7710', balance: 14_900, kind: 'vault', expires: '—' },
]

export const PAYEES: Payee[] = [
  { id: 'nia', name: 'Nia Brooks', handle: '@nia' },
  { id: 'omar', name: 'Omar Haddad', handle: '@omarh' },
  { id: 'jun', name: 'Jun Sato', handle: '@junsato' },
  { id: 'eva', name: 'Eva Lindgren', handle: '@eval' },
  { id: 'kofi', name: 'Kofi Mensah', handle: '@kofi' },
]

/** Spending by category per period, for the breakdown chart. */
export const SPENDING: Record<Period, Record<Exclude<Category, 'income' | 'transfer'>, number>> = {
  week: { groceries: 142, dining: 96, transport: 38, shopping: 64, bills: 0 },
  month: { groceries: 512, dining: 318, transport: 146, shopping: 274, bills: 890 },
  year: { groceries: 5_940, dining: 3_620, transport: 1_710, shopping: 3_380, bills: 10_680 },
}

export const BUDGETS = [
  { id: 'groceries', label: 'Groceries', spent: 512, limit: 600 },
  { id: 'dining', label: 'Dining out', spent: 318, limit: 280 },
  { id: 'transport', label: 'Transport', spent: 146, limit: 200 },
  { id: 'shopping', label: 'Shopping', spent: 274, limit: 400 },
] as const

const HOUR = 3_600_000
const DAY = 24 * HOUR

export function makeTransactions(now = Date.now()): Txn[] {
  const t = (id: number, merchant: string, category: Category, amount: number, ago: number): Txn => ({ id: `t${id}`, merchant, category, amount, time: now - ago })
  return [
    t(1, 'Corner Market', 'groceries', -23.4, 2 * HOUR),
    t(2, 'Metro Transit', 'transport', -2.9, 5 * HOUR),
    t(3, 'Salary · Northwind Labs', 'income', 4_280, 9 * HOUR),
    t(4, 'Blue Bottle Coffee', 'dining', -6.75, DAY + 2 * HOUR),
    t(5, 'Nia Brooks', 'transfer', 45, DAY + 6 * HOUR),
    t(6, 'Harbor Books', 'shopping', -31.2, DAY + 9 * HOUR),
    t(7, 'City Power & Light', 'bills', -86.13, 2 * DAY + 3 * HOUR),
    t(8, 'Green Leaf Grocers', 'groceries', -64.8, 2 * DAY + 7 * HOUR),
    t(9, 'Lumen Cinema', 'dining', -28, 3 * DAY + 4 * HOUR),
    t(10, 'Rideshare', 'transport', -14.6, 3 * DAY + 8 * HOUR),
    t(11, 'Fibrewave Internet', 'bills', -49.99, 4 * DAY + HOUR),
    t(12, 'Osteria Nove', 'dining', -72.5, 4 * DAY + 10 * HOUR),
  ]
}
