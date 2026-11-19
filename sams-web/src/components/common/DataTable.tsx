import type { Key, ReactNode } from 'react'
import { EmptyState } from './EmptyState'

export interface DataColumn<Row> {
  key: keyof Row
  label: string
  render?: (row: Row) => ReactNode
}

interface DataTableProps<Row> {
  caption: string
  rows: Row[]
  columns: DataColumn<Row>[]
  getRowKey: (row: Row) => Key
  emptyTitle?: string
  emptyMessage?: string
}

export function DataTable<Row>({
  caption,
  rows,
  columns,
  getRowKey,
  emptyTitle = 'No records yet',
  emptyMessage = 'There is no information to display.',
}: DataTableProps<Row>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyMessage} />
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => <th key={String(column.key)} scope="col">{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={String(column.key)}>
                  {column.render ? column.render(row) : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
