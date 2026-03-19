import { useMemo, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';

const STATUS_COLUMNS = ['Status', 'Health Impact', 'Churn Risk'];

function normalize(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export default function DataTable({
  rows = [],
  columns = [],
  onRowClick,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data yet',
  searchable = true,
}) {
  const [query, setQuery] = useState('');

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      columns.some((col) =>
        String(row?.[col.key] ?? '')
          .toLowerCase()
          .includes(q)
      )
    );
  }, [rows, columns, query]);

  const placeholderRows = Array.from({ length: 5 });

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="card p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-surface/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, idx) => (
                  <tr
                    key={`${row?.[columns[0]?.key] ?? 'row'}-${idx}`}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-white/5 ${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
                  >
                    {columns.map((col) => {
                      const value = row?.[col.key];
                      const showStatus = STATUS_COLUMNS.includes(col.key);

                      return (
                        <td key={col.key} className="px-4 py-3 text-sm text-zinc-200">
                          {showStatus ? (
                            <StatusBadge status={normalize(value)} />
                          ) : (
                            <span>{normalize(value)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <>
                  {placeholderRows.map((_, idx) => (
                    <tr key={`placeholder-${idx}`} className="border-b border-white/5">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm text-zinc-600">
                          —
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/5 px-4 py-3">
          {filteredRows.length > 0 ? (
            <div className="text-xs text-zinc-500">
              {filteredRows.length} row{filteredRows.length === 1 ? '' : 's'}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm font-medium text-zinc-300">{emptyMessage}</div>
              <div className="text-xs text-zinc-500">
                This table structure stays visible and will auto-populate from Google Sheets after refresh.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
