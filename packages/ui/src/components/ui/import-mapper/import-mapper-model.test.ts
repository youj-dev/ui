import { DEFAULT_FIELDS } from './import-mapper-data'
import { autoMatch, check, errorReport, findDuplicates, plan, rowIssues, type ImportField } from './import-mapper-model'

const field = (type: ImportField['type'], required = false): ImportField => ({ id: 'f', label: 'F', type, required })

describe('import rules', () => {
  test('checks a value by its field type, and only requires what is required', () => {
    expect(check(field('email', true), '  ')).toBe('required')
    expect(check(field('email'), '')).toBeNull()
    expect(check(field('email'), 'ada@example.com')).toBeNull()
    expect(check(field('email'), 'ada@')).toBe('email')
    expect(check(field('number'), '1,200.50')).toBeNull()
    expect(check(field('number'), '12k')).toBe('number')
    expect(check(field('date'), '2026-03-14')).toBeNull()
    expect(check(field('date'), '14/03/2026')).toBeNull()
    expect(check(field('date'), '03/14/2026')).toBeNull()
    expect(check(field('date'), '31/02/2026')).toBe('date')
    expect(check(field('date'), 'yesterday')).toBe('date')
    expect(check(field('text', true), 'anything')).toBeNull()
  })

  test('lists a row’s problems by field', () => {
    const issues = rowIssues({ name: '', email: 'x', phone: '', company: '', value: '5', since: '' }, DEFAULT_FIELDS, 7)
    expect(issues.map((i) => [i.row, i.fieldId, i.kind])).toEqual([
      [7, 'name', 'required'],
      [7, 'email', 'email'],
    ])
  })

  test('matches columns by name, synonym and the values they hold, each field once', () => {
    const headers = ['Full Name', 'E-mail', 'Mobile', 'Organisation', 'Deal Amount', 'Created', 'Notes', 'Contact email']
    const columns = headers.map(() => ['a', 'b'])
    columns[6] = ['x', 'y']
    const result = autoMatch(headers, columns, DEFAULT_FIELDS)
    expect(result.map((m) => m.fieldId)).toEqual(['name', 'email', 'phone', 'company', 'value', 'since', null, null])
    expect(result[1]!.confidence).toBeGreaterThan(0.9)
  })

  test('a name that only contains a synonym is a weaker match than the name itself', () => {
    const [loose] = autoMatch(['Customer email address'], [['a']], DEFAULT_FIELDS)
    expect(loose!.fieldId).toBe('email')
    expect(loose!.confidence).toBeLessThan(0.9)
    expect(loose!.confidence).toBeGreaterThanOrEqual(0.5)
  })

  test('matches an unnamed column by what its values look like', () => {
    const result = autoMatch(
      ['col1', 'col2'],
      [
        ['a', 'b'],
        ['ada@x.io', 'grace@x.io', 'linus@x.io'],
      ],
      DEFAULT_FIELDS,
    )
    expect(result[1]!.fieldId).toBe('email')
    expect(result[0]!.fieldId).toBeNull()
  })

  test('finds duplicates among existing keys and earlier rows, ignoring case and empty keys', () => {
    const rows = ['ada@x.io', 'ADA@x.io ', 'new@x.io', 'old@x.io', '', '']
    expect([...findDuplicates(rows, ['Old@X.io'])]).toEqual([1, 3])
  })

  test('plans each row by the duplicate policy', () => {
    const rows = [{ row: 1, values: { email: 'a' } }, { row: 2, values: { email: 'b' } }, null, { row: 4, values: { email: 'd' } }]
    const dupes = new Set([1])
    const skip = plan(rows, dupes, 'skip')
    expect([skip.created, skip.updated, skip.skipped]).toEqual([2, 0, 2])
    const update = plan(rows, dupes, 'update')
    expect([update.created, update.updated, update.skipped]).toEqual([2, 1, 1])
    expect(update.rows.find((r) => r.row === 2)?.action).toBe('update')
    const create = plan(rows, dupes, 'create')
    expect([create.created, create.updated, create.skipped]).toEqual([3, 0, 1])
  })

  test('writes the error report as CSV with a header and one line per problem', () => {
    const csv = errorReport(
      [{ row: 3, fieldId: 'email', value: 'a,b', kind: 'email' }],
      ['Row', 'Field', 'Value', 'Problem'],
      () => 'Email',
      () => 'Bad',
    )
    expect(csv).toBe('﻿Row,Field,Value,Problem\r\n3,Email,"a,b",Bad\r\n')
  })
})
