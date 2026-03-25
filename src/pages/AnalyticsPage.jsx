import { useMemo, useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import KpiCard from '../components/KpiCard.jsx';
import LoadingSpinner, { SkeletonTable } from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const PLACEHOLDER_ROWS = [
  { Date: '—', Platform: 'Meta', 'Campaign Name': 'Waiting for data...', Spend: '—', Impressions: '—', Clicks: '—', CTR: '—', CPC: '—', Status: '—' },
  { Date: '—', Platform: 'Google', 'Campaign Name': 'Waiting for data...', Spend: '—', Impressions: '—', Clicks: '—', CTR: '—', CPC: '—', Status: '—' },
  { Date: '—', Platform: 'Meta', 'Campaign Name': 'Waiting for data...', Spend: '—', Impressions: '—', Clicks: '—', CTR: '—', CPC: '—', Status: '—' },
];

export default function AnalyticsPage() {
  const { rows, loading, error } = useTabData('ALL_ANALYTICS');
  const [chartView, setChartView] = useState('spend');

  if (loading && (!rows || rows.length === 0)) return <div className="space-y-6 px-6 py-6"><SkeletonTable rows={5} /></div>;
  if (error) return <ErrorBanner message={error} />;

  const hasData = rows && rows.length > 0;
  const displayRows = hasData ? rows : PLACEHOLDER_ROWS;

  return (
    <div className="space-y-6 px-6 py-6">
      {!hasData && (
        <div className="rounded-[18px] px-4 py-3 text-sm flex items-center gap-3"
          style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
          <span className="text-cyan-400">◈</span>
          <span className="text-zinc-400">Analytics data will appear here once Pipedream pulls from Meta and Google Ads. Layout shown below is live when data arrives.</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total Spend" value={hasData ? calcSpend(rows) : '—'} color="warning"/>
        <KpiCard label="Impressions" value={hasData ? calcImpressions(rows) : '—'} color="info"/>
        <KpiCard label="Clicks" value={hasData ? calcClicks(rows) : '—'} color="accent"/>
        <KpiCard label="Blended CTR" value={hasData ? calcCTR(rows) : '—'} color="success"/>
        <KpiCard label="Blended CPC" value={hasData ? calcCPC(rows) : '—'} color="zinc"/>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Spend Trend</h2>
          {hasData && (
            <div className="flex gap-1">
              {[{key:'spend',label:'Spend'},{key:'impressions',label:'Impressions'},{key:'clicks',label:'Clicks'}].map((o) => (
                <button key={o.key} onClick={() => setChartView(o.key)}
                  className={"px-3 py-1 text-xs rounded-xl transition-all " + (chartView === o.key
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300")}
                  style={chartView === o.key ? { background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' } : {}}
                >{o.label}</button>
              ))}
            </div>
          )}
        </div>
        <div className="card p-4" style={{ minHeight: 200 }}>
          {hasData ? (
            <AnalyticsChart rows={rows} chartView={chartView} />
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] gap-3">
              <div className="flex items-end gap-1.5 opacity-20">
                {[40,65,45,80,55,90,70,60,85,50,75,95].map((h, i) => (
                  <div key={i} className="w-4 rounded-t-sm" style={{ height: h, background: 'rgba(6,182,212,0.6)' }} />
                ))}
              </div>
              <p className="text-xs text-zinc-600">Chart will render when ad data is available</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Analytics Data</h2>
        <DataTable
          rows={displayRows}
          columns={[
            {key:'Date',label:'Date'},{key:'Platform',label:'Platform'},
            {key:'Campaign Name',label:'Campaign'},{key:'Spend',label:'Spend'},
            {key:'Impressions',label:'Impressions'},{key:'Clicks',label:'Clicks'},
            {key:'CTR',label:'CTR'},{key:'CPC',label:'CPC'},{key:'Status',label:'Status'},
          ]}
          searchable={hasData}
          searchPlaceholder="Search analytics..."
          emptyMessage="No analytics data yet"
        />
      </section>
    </div>
  );
}

function calcSpend(rows) {
  let t = 0;
  rows.forEach(r => { const v = parseFloat((r.Spend||'0').replace(/[^0-9.-]/g,'')); if (!isNaN(v)) t += v; });
  return t > 0 ? '$' + t.toLocaleString() : '—';
}
function calcImpressions(rows) {
  let t = 0;
  rows.forEach(r => { const v = parseFloat((r.Impressions||'0').replace(/[^0-9.-]/g,'')); if (!isNaN(v)) t += v; });
  return t > 0 ? t.toLocaleString() : '—';
}
function calcClicks(rows) {
  let t = 0;
  rows.forEach(r => { const v = parseFloat((r.Clicks||'0').replace(/[^0-9.-]/g,'')); if (!isNaN(v)) t += v; });
  return t > 0 ? t.toLocaleString() : '—';
}
function calcCTR(rows) {
  let imp = 0, clicks = 0;
  rows.forEach(r => {
    const i = parseFloat((r.Impressions||'0').replace(/[^0-9.-]/g,'')); if (!isNaN(i)) imp += i;
    const c = parseFloat((r.Clicks||'0').replace(/[^0-9.-]/g,'')); if (!isNaN(c)) clicks += c;
  });
  return imp > 0 ? ((clicks/imp)*100).toFixed(2)+'%' : '—';
}
function calcCPC(rows) {
  let spend = 0, clicks = 0;
  rows.forEach(r => {
    const s = parseFloat((r.Spend||'0').replace(/[^0-9.-]/g,'')); if (!isNaN(s)) spend += s;
    const c = parseFloat((r.Clicks||'0').replace(/[^0-9.-]/g,'')); if (!isNaN(c)) clicks += c;
  });
  return clicks > 0 ? '$'+(spend/clicks).toFixed(2) : '—';
}

function AnalyticsChart({ rows, chartView }) {
  const chartData = useMemo(() =>
    rows.filter(r => r.Date).map(r => ({
      date: r.Date,
      spend: parseFloat((r.Spend||'0').replace(/[^0-9.-]/g,''))||0,
      impressions: parseFloat((r.Impressions||'0').replace(/[^0-9.-]/g,''))||0,
      clicks: parseFloat((r.Clicks||'0').replace(/[^0-9.-]/g,''))||0,
    })).slice(0,60),
  [rows]);

  const opts = [{key:'spend',color:'#f59e0b'},{key:'impressions',color:'#06b6d4'},{key:'clicks',color:'#6366f1'}];
  const active = opts.find(o => o.key === chartView) || opts[0];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={active.color} stopOpacity={0.25}/>
            <stop offset="95%" stopColor={active.color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
        <XAxis dataKey="date" tick={{fill:'#52525b',fontSize:11}} tickLine={false} axisLine={{stroke:'rgba(255,255,255,0.06)'}}/>
        <YAxis tick={{fill:'#52525b',fontSize:11}} tickLine={false} axisLine={false}/>
        <Tooltip contentStyle={{backgroundColor:'#06101a',border:'1px solid rgba(6,182,212,0.2)',borderRadius:'12px',fontSize:'12px',color:'#e4e4e7'}}/>
        <Area type="monotone" dataKey={active.key} stroke={active.color} fill="url(#chartGrad)" strokeWidth={1.5}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}
