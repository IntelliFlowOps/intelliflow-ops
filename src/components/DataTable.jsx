import { useState, useMemo } from 'react';
import StatusBadge from './StatusBadge.jsx';
import EmptyState from './EmptyState.jsx';
import { displayValue } from '../utils/format.js';

const STATUS_COLUMNS = ['Status', 'Health Impact', 'Churn Risk'];

export default function DataTable({
  rows = [],
  columns = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  onRowClick,
  onRowDoubleClick,
  emptyMessage = 'No data available',
  maxHeight = 'max-h-[600px]',
  stickyHeader = true
}) {
  const [search, setSearch] = useState('');
  const [selectedRowKey, setSelectedRowKey] = useState(null);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [rows, search]);

  if (!rows || rows.length === 0) return <EmptyState message={emptyMessage} />;

  const cols =
    columns.length > 0
      ? columns
      : Object.keys(rows[0])
          .filter((k) => !k.startsWith('_'))
          .map((key) => ({ key, label: key }));

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
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="w-full text-sm">
          <tbody>
            {filteredRows.map((row, idx) => {
              const rowKey = getRowKey(row, idx);
              const isSelected = selectedRowKey === rowKey;

              return (
                <tr
                  key={rowKey}
                  onClick={() => handleRowClick(row, idx)}
                  onDoubleClick={() => handleRowDoubleClick(row, idx)}
                  className={`cursor-pointer ${
                    isSelected ? 'bg-surface-600/80' : 'hover:bg-surface-600/60'
                  }`}
                >
                  {cols.map((col) => (
                    <td key={col.key}>
                      {displayValue(row[col.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
