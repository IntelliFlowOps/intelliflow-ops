import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function ActivityPage() {
  const { rows, loading, error } = useTabData('CUSTOMER_ACTIVITY');
  if (loading && (!rows || rows.length === 0)) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6 fade-in px-6 py-6">
      <p className="text-sm text-zinc-400">Customer activity timeline — operational notes, actions, and health signals.</p>
      <DataTable rows={rows} columns={[
        {key:'Date',label:'Date'},{key:'Customer Name',label:'Customer'},{key:'Activity Type',label:'Type'},
        {key:'Owner',label:'Owner'},{key:'Summary',label:'Summary'},{key:'Next Step',label:'Next Step'},
        {key:'Health Impact',label:'Health Impact'},{key:'Link / Reference',label:'Reference'},
      ]} searchPlaceholder="Search activity..." emptyMessage="No activity recorded yet. Add rows to the Customer_Activity tab in Google Sheets to track calls, emails, and milestones." />
      <p className="text-[10px] text-zinc-600">Activity entries are created in Google Sheets. This view is read-only.</p>
    </div>
  );
}
