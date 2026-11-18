import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface OrionTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T, index: number) => void;
  selectedRowIndex?: number;
  emptyMessage?: string;
  maxHeight?: string;
  compact?: boolean;
}

function OrionTable<T extends Record<string, any>>({
  data, columns, onRowClick, selectedRowIndex, emptyMessage = 'No data available', maxHeight = '400px', compact = false,
}: OrionTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const py = compact ? 'py-2' : 'py-3';
  const px = compact ? 'px-3' : 'px-4';

  return (
    <div className="overflow-auto rounded-lg border border-[#2a2a3d]" style={{ maxHeight }}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#1a1a2e] border-b border-[#2a2a3d]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${px} ${py} text-xs font-semibold uppercase tracking-wider text-[#8b9bb4] text-${col.align || 'left'} ${col.sortable ? 'cursor-pointer select-none hover:text-[#d4af37]' : ''}`}
                style={col.width ? { width: col.width } : {}}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[#6b6b80]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-[#2a2a3d]/50 transition-colors duration-150
                  ${idx % 2 === 0 ? 'bg-[#1a1a2e]' : 'bg-[#242438]'}
                  ${onRowClick ? 'cursor-pointer hover:bg-[#2a2a3d]' : ''}
                  ${selectedRowIndex === idx ? 'ring-1 ring-[#d4af37] bg-[#d4af37]/10' : ''}
                `}
                onClick={() => onRowClick?.(row, idx)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${px} ${py} text-${col.align || 'left'} text-[#a0a0b8]`}
                  >
                    {col.render ? col.render(row[col.key], row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OrionTable;
