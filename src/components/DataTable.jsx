import { useState, useMemo } from 'react';
import StatusBadge from './StatusBadge.jsx';
import EmptyState from './EmptyState.jsx';
import { displayValue } from '../utils/format.js';

const STATUS_COLUMNS = ['Status', 'Health Impact', 'Churn Risk'];

export default function DataTable({ rows = [], columns = [], searchable = true, searchPlaceholder = 'Search...', onRowClick, emptyMessage = 'No data available', maxHeight = 'max-h-[600px]', stickyHeader = true }) {
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) => Object.values(row).some((val) => String(val).toLowerCase().includes(q)));
  }, [rows, search]);

  if (!rows || rows.length === 0) return <EmptyState message={emptyMessage} />;

  const cols = columns.length > 0 ? columns : Object.keys(rows[0]).filter((k) => !k.startsWith('_')).map((key) => ({ key, label: key }));

  return (
    <div className="table-container fade-in">
      {searchable && (
        <div className="p-3 border-b border-surface-500/40">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} className="input-base w-full max-w-xs" />
          {search && filteredRows.length !== rows.length && <span className="ml-3 text-xs text-zinc-500">{filteredRows.length} of {rows.length} rows</span>}
        </div>
      )}
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="w-full text-sm">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-surface-600/80 backdrop-blur-sm border-b border-surface-500/40">
              {cols.map((col) => <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">{col.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-500/20">
            {filteredRows.length === 0 ? (
              <tr><td colSpan={cols.length} className="px-4 py-8 text-center text-zinc-500 text-sm">No matching results</td></tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} onClick={() => onRowClick?.(row)} className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-surface-600/60' : 'hover:bg-surface-600/30'}`}>
                  {cols.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      {STATUS_COLUMNS.includes(col.label || col.key) ? <StatusBadge status={row[col.key]} /> : col.render ? col.render(row[col.key], row) : displayValue(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filteredRows.length > 0 && <div className="px-4 py-2 border-t border-surface-500/30 text-xs text-zinc-500">{filteredRows.length} row{filteredRows.length !== 1 ? 's' : ''}</div>}
    </div>
  );
}
