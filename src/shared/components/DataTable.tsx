import type { TableColumn } from "@/shared/types/table";

type DataTableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  emptyLabel?: string;
};

export function DataTable<T>({ columns, rows, getRowKey, emptyLabel = "No rows match the current filters." }: DataTableProps<T>) {
  if (!rows.length) {
    return <div className="empty-state">{emptyLabel}</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className={column.align === "right" ? "num" : undefined} style={{ width: column.width }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey(row, index)}>
              {columns.map((column) => {
                const value = column.render ? column.render(row) : String(row[column.key as keyof T] ?? "");
                return (
                  <td key={String(column.key)} className={column.align === "right" ? "num" : undefined}>
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

