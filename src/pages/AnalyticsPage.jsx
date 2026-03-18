import { useMemo, useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import KpiCard from '../components/KpiCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function AnalyticsPage() {
  const { rows, loading, error } = useTabData('ALL_ANALYTICS');
  const [chartView, setChartView] = useState('spend');
  if (loading && (!rows || rows.length === 0)) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!rows || rows.length === 0) return <EmptyState message="No analytics data yet" />;

  return (
    <div className="space-y-6 fade-in">
      <AnalyticsSummary rows={rows} />
      <AnalyticsChart rows={rows} chartView={chartView} setChartView={setChartView} />
      <section>
        <h2 className="section-title mb-3">All Analytics Data</h2>
        <DataTable rows={rows} columns={[{key:'Date',label:'Date'},{key:'Platform',label:'Platform'},{key:'Campaign Name',label:'Campaign'},{key:'Spend',label:'Spend'},{key:'Impressions',label:'Impressions'},{key:'Clicks',label:'Clicks'},{key:'CTR',label:'CTR'},{key:'CPC',label:'CPC'},{key:'Status',label:'Status'}]} searchPlaceholder="Search analytics..." emptyMessage="No analytics data yet" />
      </section>
    </div>
  );
}

function AnalyticsSummary({ rows }) {
  const s = useMemo(() => {
    let spend=0,imp=0,clicks=0;
    rows.forEach((r)=>{const sp=parseFloat((r.Spend||'').replace(/[^0-9.-]/g,''));const im=parseFloat((r.Impressions||'').replace(/[^0-9.-]/g,''));const cl=parseFloat((r.Clicks||'').replace(/[^0-9.-]/g,''));if(!isNaN(sp))spend+=sp;if(!isNaN(im))imp+=im;if(!isNaN(cl))clicks+=cl;});
    return{spend:spend>0?'$'+spend.toLocaleString():'—',impressions:imp>0?imp.toLocaleString():'—',clicks:clicks>0?clicks.toLocaleString():'—',ctr:imp>0?((clicks/imp)*100).toFixed(2)+'%':'—',cpc:clicks>0?'$'+(spend/clicks).toFixed(2):'—'};
  },[rows]);
  return (<div className="grid grid-cols-2 md:grid-cols-5 gap-3"><KpiCard label="Total Spend" value={s.spend} color="warning"/><KpiCard label="Total Impressions" value={s.impressions} color="info"/><KpiCard label="Total Clicks" value={s.clicks} color="accent"/><KpiCard label="Blended CTR" value={s.ctr} color="success"/><KpiCard label="Blended CPC" value={s.cpc} color="zinc"/></div>);
}

function AnalyticsChart({ rows, chartView, setChartView }) {
  const chartData = useMemo(() => rows.filter((r)=>r.Date).map((r)=>({date:r.Date,spend:parseFloat((r.Spend||'0').replace(/[^0-9.-]/g,''))||0,impressions:parseFloat((r.Impressions||'0').replace(/[^0-9.-]/g,''))||0,clicks:parseFloat((r.Clicks||'0').replace(/[^0-9.-]/g,''))||0})).slice(0,60),[rows]);
  if (chartData.length === 0) return null;
  const opts = [{key:'spend',label:'Spend',color:'#f59e0b'},{key:'impressions',label:'Impressions',color:'#3b82f6'},{key:'clicks',label:'Clicks',color:'#6366f1'}];
  const active = opts.find((o)=>o.key===chartView)||opts[0];
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">Trend</h2>
        <div className="flex gap-1">{opts.map((o)=><button key={o.key} onClick={()=>setChartView(o.key)} className={`px-3 py-1 text-xs rounded-md transition-colors ${chartView===o.key?'bg-surface-500 text-zinc-200':'text-zinc-500 hover:text-zinc-300 hover:bg-surface-600/50'}`}>{o.label}</button>)}</div>
      </div>
      <div className="card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
            <defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={active.color} stopOpacity={0.3}/><stop offset="95%" stopColor={active.color} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a"/>
            <XAxis dataKey="date" tick={{fill:'#71717a',fontSize:11}} tickLine={false} axisLine={{stroke:'#27272a'}}/>
            <YAxis tick={{fill:'#71717a',fontSize:11}} tickLine={false} axisLine={false}/>
            <Tooltip contentStyle={{backgroundColor:'#18181b',border:'1px solid #3f3f46',borderRadius:'8px',fontSize:'12px',color:'#e4e4e7'}}/>
            <Area type="monotone" dataKey={active.key} stroke={active.color} fill="url(#chartGrad)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
