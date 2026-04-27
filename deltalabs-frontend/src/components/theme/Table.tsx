import type { ReactNode } from "react";

import { Typography } from "@/components/theme/Typography";

type TableColumn<Row> = Readonly<{
  id: string;
  header: string;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
  cell: (row: Row, rowIndex: number) => ReactNode;
}>;

type TableProps<Row> = Readonly<{
  rows: readonly Row[];
  columns: readonly TableColumn<Row>[];
  rowKey: (row: Row, rowIndex: number) => string;
  tableClassName?: string;
  emptyMessage?: string;
  density?: "comfortable" | "compact";
}>;

export function Table<Row>({
  rows,
  columns,
  rowKey,
  tableClassName = "w-full min-w-[720px] border-collapse text-sm",
  emptyMessage,
  density = "compact",
}: TableProps<Row>) {
  const headerCellBase =
    density === "compact"
      ? "h-10 border-r border-border-default px-3 py-2 align-middle last:border-r-0"
      : "border-r border-border-default px-3 py-3 last:border-r-0";
  const bodyCellBase =
    density === "compact"
      ? "h-10 border-r border-border-default px-3 py-2 align-middle text-[13px] text-text-primary last:border-r-0"
      : "border-r border-border-default px-3 py-3 text-text-primary last:border-r-0";
  const alignClass = (align: TableColumn<Row>["align"]) =>
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <div className="overflow-x-auto rounded-lg border border-border-default/90 bg-surface-default">
      <table className={tableClassName}>
        <thead>
          <tr className="border-b border-border-default bg-surface-muted/60">
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={column.headerClassName ?? `${headerCellBase} ${alignClass(column.align)}`}
              >
                <Typography as="span" variant="label" className="text-[13px] font-semibold text-text-primary">
                  {column.header}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowKey(row, rowIndex)}
              className={
                rowIndex % 2 === 0
                  ? "border-b border-border-default bg-surface-default last:border-b-0"
                  : "border-b border-border-default bg-surface-muted/15 last:border-b-0"
              }
            >
              {columns.map((column) => (
                <td key={column.id} className={column.className ?? `${bodyCellBase} ${alignClass(column.align)}`}>
                  {column.cell(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && emptyMessage ? (
        <div className="px-3 py-3">
          <Typography variant="small" className="text-text-secondary">
            {emptyMessage}
          </Typography>
        </div>
      ) : null}
    </div>
  );
}

export type { TableColumn, TableProps };

