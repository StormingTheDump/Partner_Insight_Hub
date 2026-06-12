import type { TableColumn } from "@/shared/types/table";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function useCsvExport<T>(filename: string, columns: TableColumn<T>[], rows: T[]) {
  return () => {
    const header = columns.map((column) => escapeCsv(column.header)).join(",");
    const body = rows
      .map((row) =>
        columns
          .map((column) => {
            const value = row[column.key as keyof T];
            return escapeCsv(value);
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob([[header, body].filter(Boolean).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
}
