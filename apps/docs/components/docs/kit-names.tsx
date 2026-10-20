import { kitNameRows, type KitName } from '@/lib/kit-names'
import { ScrollTable } from './scroll-table'

export function KitNames({ kit }: { kit: KitName }) {
  return (
    <ScrollTable>
      <thead>
        <tr>
          <th>Category</th>
          <th>{kit === 'loaders' ? 'Loader ids' : 'Scene ids'}</th>
        </tr>
      </thead>
      <tbody>
        {kitNameRows(kit).map(({ category, ids }) => (
          <tr key={category}>
            <td>{category}</td>
            <td>
              {ids.map((id, i) => (
                <span key={id}>
                  {i > 0 && ' '}
                  <code className="inline-code">{id}</code>
                </span>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </ScrollTable>
  )
}
