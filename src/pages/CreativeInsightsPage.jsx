import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner, { SkeletonTable } from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

const PLACEHOLDER_ROWS = [
  { Date: '—', Platform: 'Meta', Niche: 'HVAC', 'Winning Hook': 'Waiting for data...', 'Winning CTA': '—', 'Best Creative Type': '—', 'What Is Not Working': '—', 'Next Test Idea': '—' },
  { Date: '—', Platform: 'Google', Niche: 'Plumbing', 'Winning Hook': 'Waiting for data...', 'Winning CTA': '—', 'Best Creative Type': '—', 'What Is Not Working': '—', 'Next Test Idea': '—' },
  { Date: '—', Platform: 'Meta', Niche: 'Roofing', 'Winning Hook': 'Waiting for data...', 'Winning CTA': '—', 'Best Creative Type': '—', 'What Is Not Working': '—', 'Next Test Idea': '—' },
];

const COLUMNS = [
  {key:'Date',label:'Date'},{key:'Platform',label:'Platform'},{key:'Niche',label:'Niche'},
  {key:'Winning Hook',label:'Winning Hook'},{key:'Winning CTA',label:'Winning CTA'},
  {key:'Best Creative Type',label:'Best Creative'},{key:'What Is Not Working',label:'Not Working'},
  {key:'Next Test Idea',label:'Next Test'},
];

export default function CreativeInsightsPage() {
  const { rows, loading, error } = useTabData('CREATIVE_INSIGHTS');

  if (loading && (!rows || rows.length === 0)) return <div className="space-y-6 px-6 py-6"><SkeletonTable rows={4} /></div>;
  if (error) return <ErrorBanner message={error} />;

  const hasData = rows && rows.length > 0;
  const displayRows = hasData ? rows : PLACEHOLDER_ROWS;

  return (
    <div className="space-y-6 px-6 py-6">
      <p className="text-sm text-zinc-400">
        What marketers should test, keep, and cut — updated by the main agent from campaign performance data.
      </p>

      {!hasData && (
        <div className="rounded-[18px] px-4 py-3 text-sm flex items-center gap-3"
          style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
          <span className="text-cyan-400">◈</span>
          <span className="text-zinc-400">Creative insights will populate here once campaign data is added to Google Sheets. Column structure is ready.</span>
        </div>
      )}

      <DataTable
        rows={displayRows}
        columns={COLUMNS}
        searchable={hasData}
        searchPlaceholder="Search insights..."
        emptyMessage="No creative insights recorded yet"
      />

      <p className="text-[10px] text-zinc-600">Creative insights are populated in Google Sheets. This view is read-only.</p>
    </div>
  );
}
