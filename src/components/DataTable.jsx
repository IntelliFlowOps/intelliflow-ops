import { useMemo, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import { displayValue } from '../utils/format.js';

const STATUS_COLUMNS = ['Status', 'Health Impact', 'Churn Risk', 'Attribution', 'Paid Out?'];

export default function DataTable({
  rows = [],
  columns = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  onRowClick,
  onRowDoubleClick,
  emptyMessage = 'No data yet',
  maxHeight = 'max-h-[600px]',
  stickyHeader = true
}) {
  const [query, setQuery] = useState('');
  const [selectedRowKey, setSelectedRowKey] = useState(null);

  const cols =
    columns.length > 0
      ? columns
      : rows.length > 0
      ? Object.keys(rows[0])
          .filter((k) => !k.startsWith('_'))
          .map((key) => ({ key, label: key }))
      : [];

  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? '').toLowerCase().includes(q)
      )
    );
  }, [rows, query]);

  const getRowKey = (row, idx) =>
    row?.id ??
    row?.['Stripe Customer ID'] ??
    row?.['Campaign ID / Link'] ??
    row?.['Customer Name'] ??
    row?.['Campaign Name'] ??
    `${idx}`;

  const handleRowClick = (row, idx) => {
    setSelectedRowKey(getRowKey(row, idx));
    onRowClick?.(row);
  };

  const handleRowDoubleClick = (row, idx) => {
    setSelectedRowKey(getRowKey(row, idx));
    onRowDoubleClick?.(row);
  };

  return (
    <div className="table-container fade-in">
      {searchable && (
        <div className="p-3 border-b border-surface-500/40">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="input-base w-full max-w-xs"
          />
          {rows.length > 0 && query && filteredRows.length !== rows.length && (
            <span className="ml-3 text-xs text-zinc-500">
              {filteredRows.length} of {rows.length} rows
            </span>
          )}
        </div>
      )}

      <div className={`overflow-auto ${maxHeight}`}>
        <table className="w-full text-sm">
          {cols.length > 0 && (
            <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
              <tr className="bg-surface-600/80 backdrop-blur-sm border-b border-surface-500/40">
                {cols.map((col) => (
                  <th
                    key={col.key}
                    className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          <tbody className="divide-y divide-surface-500/20">
            {cols.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={cols.length}
                  className="px-4 py-10 text-center text-zinc-500 text-sm"
                >
                  {rows.length === 0 ? emptyMessage : 'No matching results'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => {
                const rowKey = getRowKey(row, idx);
                const isSelected = selectedRowKey === rowKey;
                const isInteractive = !!(onRowClick || onRowDoubleClick);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => handleRowClick(row, idx)}
                    onDoubleClick={() => handleRowDoubleClick(row, idx)}
                    className={`group/row relative transition-all duration-150 ${
                      isInteractive ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'bg-cyan-400/[0.07]'
                        : isInteractive
                        ? 'hover:bg-white/[0.025]'
                        : 'hover:bg-white/[0.015]'
                    }`}
                  >
                    {cols.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 whitespace-nowrap transition-colors duration-150 ${col.key === cols[0].key ? 'relative' : ''} ${isSelected ? 'text-zinc-100' : 'text-zinc-300 group-hover/row:text-zinc-100'}`}
                      >
                        {col.key === cols[0].key && (
                          <span className={`pointer-events-none absolute left-0 top-[10%] h-[80%] w-[2px] rounded-r-full bg-gradient-to-b from-cyan-400 to-cyan-600 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'}`} />
                        )}
                        {STATUS_COLUMNS.includes(col.label || col.key) ? (
                          <StatusBadge status={row[col.key]} />
                        ) : col.render ? (
                          col.render(row[col.key], row)
                        ) : (
                          displayValue(row[col.key])
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-surface-500/30 text-xs text-zinc-500">
        {filteredRows.length} row{filteredRows.length === 1 ? '' : 's'}
      </div>
    </div>
  );
}
