import { DEALS, DEAL_FIELDS, NESTED_FILTER } from './filter-builder.fixtures'
import { EMPTY_FILTER, describeFilter, isRuleComplete, matchFilter, operatorsFor, type FilterGroup, type FilterRule } from './filter-builder-model'

const group = (combinator: 'and' | 'or', ...children: FilterGroup['children']): FilterGroup => ({ type: 'group', combinator, children })
const rule = (field: string, operator: FilterRule['operator'], value?: FilterRule['value']): FilterRule => ({ type: 'rule', field, operator, value })
const names = (filter: FilterGroup, now?: Date) => DEALS.filter((deal) => matchFilter(deal, filter, { now })).map((deal) => deal.name)

describe('operatorsFor', () => {
  test('each field type offers the operators that suit it', () => {
    expect(operatorsFor('text')).toEqual(expect.arrayContaining(['contains', 'startsWith']))
    expect(operatorsFor('number')).toEqual(expect.arrayContaining(['gt', 'lt', 'between']))
    expect(operatorsFor('date')).toEqual(expect.arrayContaining(['before', 'after', 'inLast', 'between']))
    expect(operatorsFor('select')).toEqual(expect.arrayContaining(['is', 'isAnyOf']))
    expect(operatorsFor('multiselect')).toEqual(expect.arrayContaining(['hasAny', 'hasAll']))
    expect(operatorsFor('boolean')).toEqual(['isTrue', 'isFalse'])
    expect(operatorsFor('text')).not.toContain('gt')
  })
})

describe('matchFilter', () => {
  test('an empty group matches every row', () => {
    expect(names(EMPTY_FILTER)).toHaveLength(DEALS.length)
  })

  test('AND needs every rule, OR needs one', () => {
    expect(names(group('and', rule('owner', 'is', 'Ada'), rule('stage', 'is', 'Won')))).toEqual(['Umbrella expansion'])
    expect(names(group('or', rule('owner', 'is', 'Ada'), rule('stage', 'is', 'Lost')))).toEqual(['Northwind renewal', 'Umbrella expansion', 'Stark audit'])
  })

  test('nested groups combine as written', () => {
    expect(names(NESTED_FILTER)).toEqual(['Northwind renewal', 'Globex rollout', 'Umbrella expansion'])
  })

  test('text compares without case', () => {
    expect(names(group('and', rule('name', 'contains', 'RENEWAL')))).toEqual(['Northwind renewal'])
    expect(names(group('and', rule('name', 'startsWith', 'g')))).toEqual(['Globex rollout'])
    expect(names(group('and', rule('stage', 'is', 'won')))).toEqual(['Umbrella expansion'])
  })

  test('numbers compare as numbers', () => {
    expect(names(group('and', rule('amount', 'lt', 10000)))).toEqual(['Initech pilot'])
    expect(names(group('and', rule('amount', 'between', [30000, 54000])))).toEqual(['Northwind renewal', 'Hooli licenses', 'Stark audit'])
    expect(names(group('and', rule('amount', 'is', '9000')))).toEqual(['Initech pilot'])
  })

  test('dates compare by day', () => {
    expect(names(group('and', rule('closes', 'before', '2026-09-30')))).toEqual(['Umbrella expansion', 'Stark audit'])
    expect(names(group('and', rule('closes', 'after', '2026-11-17')))).toEqual(['Globex rollout', 'Hooli licenses'])
    expect(names(group('and', rule('closes', 'is', '2026-11-04')))).toEqual(['Northwind renewal'])
    expect(names(group('and', rule('closes', 'between', ['2026-10-01', '2026-11-05'])))).toEqual(['Northwind renewal', 'Initech pilot'])
  })

  test('"in the last N days" counts back from now, today included and the future excluded', () => {
    const now = new Date(2026, 10, 10)
    expect(names(group('and', rule('closes', 'inLast', 10)), now)).toEqual(['Northwind renewal'])
    expect(names(group('and', rule('closes', 'inLast', 0)), now)).toEqual([])
  })

  test('lists match any or all of the picks', () => {
    expect(names(group('and', rule('tags', 'hasAny', ['partner', 'renewal'])))).toEqual(['Northwind renewal', 'Umbrella expansion', 'Hooli licenses', 'Stark audit'])
    expect(names(group('and', rule('tags', 'hasAll', ['enterprise', 'renewal'])))).toEqual(['Northwind renewal'])
    expect(names(group('and', rule('stage', 'isAnyOf', ['Lead', 'Won'])))).toEqual(['Initech pilot', 'Umbrella expansion'])
  })

  test('empty, not empty and booleans need no value', () => {
    expect(names(group('and', rule('tags', 'isEmpty')))).toEqual(['Initech pilot'])
    expect(names(group('and', rule('tags', 'isNotEmpty')))).toHaveLength(5)
    expect(names(group('and', rule('starred', 'isTrue')))).toEqual(['Northwind renewal', 'Umbrella expansion'])
    expect(names(group('and', rule('starred', 'isFalse')))).toHaveLength(4)
  })

  test('an incomplete rule and an empty nested group do not narrow', () => {
    const filter = group('and', rule('owner', 'is', ''), rule('amount', 'between', [1, null]), group('or'))
    expect(names(filter)).toHaveLength(DEALS.length)
    expect(isRuleComplete(rule('owner', 'is', ''))).toBe(false)
    expect(isRuleComplete(rule('owner', 'isEmpty'))).toBe(true)
  })

  test('reads fields through `get` when asked', () => {
    const rows = [{ fields: { owner: 'Ada' } }, { fields: { owner: 'Grace' } }]
    const hits = rows.filter((row) => matchFilter(row, group('and', rule('owner', 'is', 'Ada')), { get: (r: { fields: Record<string, string> }, f) => r.fields[f] }))
    expect(hits).toHaveLength(1)
  })
})

describe('describeFilter', () => {
  test('writes rules and nested groups as a sentence', () => {
    expect(describeFilter(NESTED_FILTER, DEAL_FIELDS)).toBe('Stage is not Lost and (Owner is Ada or Amount > 100000)')
  })

  test('uses the options’ labels and spells out each operator', () => {
    const filter = group(
      'or',
      rule('tags', 'hasAny', ['enterprise', 'partner']),
      rule('amount', 'between', [10, 20]),
      rule('closes', 'inLast', 7),
      rule('tags', 'isEmpty'),
    )
    expect(describeFilter(filter, DEAL_FIELDS)).toBe('Tags has any of Enterprise, Partner or Amount is between 10 and 20 or Close date is in the last 7 days or Tags is empty')
  })

  test('leaves out incomplete rules and unknown fields, and an empty filter is empty', () => {
    expect(describeFilter(group('and', rule('owner', 'is', ''), rule('nope', 'is', 'x'), rule('stage', 'is', 'Won')), DEAL_FIELDS)).toBe('Stage is Won')
    expect(describeFilter(EMPTY_FILTER, DEAL_FIELDS)).toBe('')
  })

  test('a nested group of one part has no brackets', () => {
    expect(describeFilter(group('and', rule('stage', 'is', 'Won'), group('or', rule('owner', 'is', 'Ada'))), DEAL_FIELDS)).toBe('Stage is Won and Owner is Ada')
  })
})
