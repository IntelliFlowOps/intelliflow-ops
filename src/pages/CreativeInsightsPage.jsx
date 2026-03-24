import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner, { SkeletonTable } from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function CreativeInsightsPage() {
  const { rows, loading, error } = useTabData('CREATIVE_INSIGHTS');
  if (loading && (!rows || rows.length === 0)) return <div className='space-y-6 fade-in px-6 py-6'><SkeletonTable rows={4} /></div>;
  if (error) return <ErrorBanner message={error} />;
  if (!rows || rows.length === 0) return <EmptyState message="No creative insights yet. Add rows to the Creative_Insights tab in Google Sheets after reviewing ad performance." />;

  return (
    <div className="space-y-6 fade-in px-6 py-6">
      <p className="text-sm text-zinc-400">What marketers should test, keep, and cut — updated by DoAnything from campaign performance data.</p>
      <DataTable rows={rows} columns={[
        {key:'Date',label:'Date'},{key:'Platform',label:'Platform'},{key:'Niche',label:'Niche'},
        {key:'Winning Hook',label:'Winning Hook'},{key:'Winning CTA',label:'Winning CTA'},
        {key:'Best Creative Type',label:'Best Creative'},{key:'What Is Not Working',label:'Not Working'},{key:'Next Test Idea',label:'Next Test'},
      ]} searchPlaceholder="Search insights..." emptyMessage="No creative insights recorded yet" />
      <p className="text-[10px] text-zinc-600">Creative insights are populated in Google Sheets. This view is read-only.</p>
    </div>
  );
}
