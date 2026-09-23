import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Zap,
  Target,
  Calendar,
  Info,
} from 'lucide-react';
import {
  ALL_FORECAST_SERIES,
  FORECAST_REVENUE,
  FORECAST_CASH_FLOW,
  FORECAST_PRODUCTIVITY,
  FORECAST_TURNOVER,
  FORECAST_CSAT,
  FORECAST_NPS,
  FORECAST_COMPLETION,
  FORECAST_BUDGET_VARIANCE,
  MONTHLY_SEASONALITY,
  FORECAST_SUMMARIES,
  type ForecastSeries,
  type ForecastSummary,
} from '../data/forecastData';

// ── colour helpers ────────────────────────────────────────────────────────────
const DOMAIN_COLORS: Record<string, string> = {
  Financial: '#6366f1',
  Workforce: '#34d399',
  'Customer Experience': '#a78bfa',
  Project: '#f59e0b',
};

const TREND_ICON = (t: string) =>
  t === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-600" /> :
  t === 'down' ? <TrendingDown className="w-4 h-4 text-red-600" /> :
  <Minus className="w-4 h-4 text-slate-400" />;

const fmtVal = (v: number, unit: string) => {
  if (unit === '$') {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  }
  if (unit === '%') return `${v.toFixed(1)}%`;
  return v.toFixed(2);
};

const fmtShort = (date: string) => {
  const [y, m] = date.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
};

// ── custom tooltip ────────────────────────────────────────────────────────────
const ForecastTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-surface border border-bg-border rounded-lg p-3 text-xs shadow-elevated">
      <p className="text-text-secondary font-semibold mb-2">{label}</p>
      {payload.map((e: any, i: number) => (
        e.value !== null && e.value !== undefined && (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <span className="text-text-muted">{e.name}:</span>
            <span className="text-text-primary font-semibold">{fmtVal(e.value, unit)}</span>
          </div>
        )
      ))}
    </div>
  );
};

// ── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({ s }: { s: ForecastSummary }) => {
  const isNeg = s.forecastChangePercent < 0;
  const isGoodNeg = ['Turnover_Rate', 'Avg_Budget_Variance_Pct'].includes(s.kpi);
  const positive = isGoodNeg ? isNeg : !isNeg;
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-xl p-4 flex flex-col gap-2 hover:border-slate-400 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: DOMAIN_COLORS[s.domain] }}>
          {s.domain}
        </span>
        {s.totalAnomalies > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-400/10 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-2.5 h-2.5" />{s.totalAnomalies} anomalies
          </span>
        )}
      </div>
      <p className="text-text-secondary font-semibold text-sm">{s.label}</p>
      <p className="text-2xl font-bold text-text-primary">{fmtVal(s.latestActual, s.unit)}</p>
      <div className="flex items-center gap-1.5">
        {TREND_ICON(s.trend)}
        <span className={`text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isNeg ? '' : '+'}{s.forecastChangePercent.toFixed(1)}%
        </span>
        <span className="text-xs text-text-muted">vs forecast</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-text-muted">Forecast: {fmtVal(s.latestForecast, s.unit)}</span>
        <span className="text-[10px] text-text-muted">{s.confidence}% CI</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
        <div
          className="h-1 rounded-full"
          style={{
            width: `${Math.min(Math.abs(s.forecastChangePercent) * 3, 100)}%`,
            background: s.color,
          }}
        />
      </div>
    </div>
  );
};

// ── Forecast Chart ────────────────────────────────────────────────────────────
const ForecastChart = ({ series }: { series: ForecastSeries }) => {
  const chartData = series.data.map(d => ({
    date: fmtShort(d.date),
    actual: d.actual,
    forecast: d.yhat,
    trend: d.trend,
    lower: d.lower,
    upper: d.upper,
    band: [d.lower, d.upper] as [number, number],
    isAnomaly: d.isAnomaly,
  }));

  const anomalyDates = series.data
    .filter(d => d.isAnomaly)
    .map(d => fmtShort(d.date));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 16 }}>
        <defs>
          <linearGradient id={`ci-${series.kpi}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={series.color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={series.color} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} interval={3} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false}
          tickFormatter={(v) => fmtVal(v, series.unit)} width={60} />
        <Tooltip content={<ForecastTooltip unit={series.unit} />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />

        {/* 95% confidence band */}
        <Area
          dataKey="upper" fill={`url(#ci-${series.kpi})`} stroke="none"
          name="95% CI Upper" legendType="none" />
        <Area
          dataKey="lower" fill="white" fillOpacity={0} stroke="none"
          name="95% CI Lower" legendType="none" />

        {/* trend line */}
        <Line dataKey="trend" stroke="#94A3B8" strokeWidth={1} dot={false}
          strokeDasharray="4 4" name="Trend" />

        {/* forecast */}
        <Line dataKey="forecast" stroke={series.targetColor} strokeWidth={2}
          dot={false} strokeDasharray="6 3" name="Forecast (yhat)" />

        {/* actual */}
        <Line dataKey="actual" stroke={series.color} strokeWidth={2.5}
          dot={(props: any) => {
            const { cx, cy, payload } = props;
            if (payload.isAnomaly) {
              return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fca5a5" strokeWidth={2} />;
            }
            return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill={series.color} stroke="transparent" />;
          }}
          name="Actual" />

        {/* anomaly reference lines */}
        {anomalyDates.map(d => (
          <ReferenceLine key={d} x={d} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// ── Seasonality Chart ─────────────────────────────────────────────────────────
const SeasonalityChart = () => {
  const [activeKey, setActiveKey] = useState<keyof typeof MONTHLY_SEASONALITY[0]>('revenue');
  const keys: { key: keyof typeof MONTHLY_SEASONALITY[0]; label: string; color: string }[] = [
    { key: 'revenue',     label: 'Revenue',     color: '#6366f1' },
    { key: 'cashFlow',    label: 'Cash Flow',   color: '#22d3ee' },
    { key: 'productivity',label: 'Productivity',color: '#34d399' },
    { key: 'csat',        label: 'CSAT',        color: '#a78bfa' },
    { key: 'nps',         label: 'NPS',         color: '#f59e0b' },
    { key: 'completion',  label: 'Completion',  color: '#10b981' },
  ];
  const activeColor = keys.find(k => k.key === activeKey)?.color ?? '#6366f1';

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {keys.map(k => (
          <button key={k.key} onClick={() => setActiveKey(k.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
              activeKey === k.key
                ? 'text-white border-transparent'
                : 'text-text-muted border-bg-border hover:border-slate-400'
            }`}
            style={activeKey === k.key ? { background: k.color, borderColor: k.color } : {}}
          >
            {k.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={MONTHLY_SEASONALITY} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} />
          <Tooltip formatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} />
          <ReferenceLine y={0} stroke="#94A3B8" />
          <Bar dataKey={activeKey} radius={[3, 3, 0, 0]} name="Seasonality Effect">
            {MONTHLY_SEASONALITY.map((entry, i) => (
              <Cell key={i} fill={(entry[activeKey] as number) >= 0 ? activeColor : '#ef4444'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-text-muted mt-2 text-center">
        Monthly deviation from annual mean (%) — positive months outperform, negative underperform
      </p>
    </div>
  );
};

// ── Anomaly Forecast Table ────────────────────────────────────────────────────
interface AnomalyRow {
  date: string;
  domain: string;
  kpi: string;
  label: string;
  actual: number;
  yhat: number;
  score: number;
  unit: string;
  color: string;
}

const buildAnomalyRows = (): AnomalyRow[] => {
  const rows: AnomalyRow[] = [];
  for (const s of ALL_FORECAST_SERIES) {
    for (const d of s.data) {
      if (d.isAnomaly && d.anomalyScore > 0 && d.actual !== null) {
        rows.push({
          date: d.date,
          domain: s.domain,
          kpi: s.kpi,
          label: s.label,
          actual: d.actual!,
          yhat: d.yhat,
          score: d.anomalyScore,
          unit: s.unit,
          color: s.color,
        });
      }
    }
  }
  return rows.sort((a, b) => b.score - a.score);
};

const AnomalyTable = () => {
  const rows = useMemo(buildAnomalyRows, []);
  const [expanded, setExpanded] = useState<string | null>(null);

  const severityBadge = (score: number) => {
    if (score >= 15) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 border border-red-500/30">Critical</span>;
    if (score >= 5)  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30">Warning</span>;
    return                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 border border-blue-500/30">Low</span>;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-bg-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-bg-elevated border-b border-bg-border">
            <th className="px-4 py-3 text-left text-text-muted font-semibold">Date</th>
            <th className="px-4 py-3 text-left text-text-muted font-semibold">Domain</th>
            <th className="px-4 py-3 text-left text-text-muted font-semibold">KPI</th>
            <th className="px-4 py-3 text-right text-text-muted font-semibold">Actual</th>
            <th className="px-4 py-3 text-right text-text-muted font-semibold">Forecast</th>
            <th className="px-4 py-3 text-right text-text-muted font-semibold">Score</th>
            <th className="px-4 py-3 text-center text-text-muted font-semibold">Severity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const key = `${r.date}-${r.kpi}`;
            const isOpen = expanded === key;
            const deviation = ((r.actual - r.yhat) / Math.abs(r.yhat) * 100).toFixed(1);
            return (
              <React.Fragment key={key}>
                <tr
                  className={`border-b border-bg-border hover:bg-black/5 cursor-pointer transition-colors ${
                    i % 2 === 0 ? 'bg-bg-base' : 'bg-transparent'
                  }`}
                  onClick={() => setExpanded(isOpen ? null : key)}
                >
                  <td className="px-4 py-3 text-text-secondary">{fmtShort(r.date)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-xs" style={{ color: DOMAIN_COLORS[r.domain] }}>
                      {r.domain}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{r.label}</td>
                  <td className="px-4 py-3 text-right text-text-primary font-semibold">{fmtVal(r.actual, r.unit)}</td>
                  <td className="px-4 py-3 text-right text-text-muted">{fmtVal(r.yhat, r.unit)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-amber-600">{r.score.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {severityBadge(r.score)}
                      {isOpen ? <ChevronUp className="w-3 h-3 text-text-muted" /> : <ChevronDown className="w-3 h-3 text-text-muted" />}
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-bg-border bg-bg-elevated">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="text-text-muted mb-1">Deviation from Forecast</p>
                          <p className={`font-bold text-base ${r.actual > r.yhat ? 'text-emerald-600' : 'text-red-600'}`}>
                            {r.actual > r.yhat ? '+' : ''}{deviation}%
                          </p>
                        </div>
                        <div>
                          <p className="text-text-muted mb-1">Absolute Difference</p>
                          <p className="text-text-primary font-semibold">
                            {r.actual > r.yhat ? '+' : ''}{fmtVal(r.actual - r.yhat, r.unit)}
                          </p>
                        </div>
                        <div>
                          <p className="text-text-muted mb-1">Anomaly Score</p>
                          <p className="text-amber-600 font-bold">{r.score.toFixed(2)} σ</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="text-center text-text-muted py-12 text-sm">No anomalies detected</div>
      )}
    </div>
  );
};

// ── AI Recommendations ────────────────────────────────────────────────────────
const AI_RECS = [
  {
    type: 'critical', title: 'Project Portfolio Recovery Critical',
    body: 'Completion rate crashed to near-0% in Q1 2026 with -100% budget variance. Prophet trend line signals continued deterioration. Immediate portfolio review and resource reallocation required. Forecast suggests recovery to ~70% by mid-2026 only with corrective action.',
    action: 'Trigger emergency PMO review, freeze new project intake.',
    icon: AlertTriangle, color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30',
  },
  {
    type: 'watch', title: 'Revenue Trend Declining Long-Term',
    body: 'Prophet trend component shows revenue declining from ~$81K (Jan 2025) to ~$77K (Sep 2027) — a steady erosion of ~5%. Nov 2025 anomaly ($58.5K) was a critical low. Seasonal July dips are structural (-1.8%). Forecast confidence intervals are widening in 2027.',
    action: 'Investigate product pricing, customer acquisition costs, and seasonal hedging strategies.',
    icon: TrendingDown, color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30',
  },
  {
    type: 'positive', title: 'Cash Flow Trajectory Improving',
    body: 'Cash flow trend rises from ~$72K to ~$76K over the forecast horizon (+5.5%). Oct 2026 spike ($87K, score 18.4) represents a positive outlier. Seasonal Q4 strength is consistent (+4–6% in Nov/Dec). Confidence intervals remain tight.',
    action: 'Reinforce Q4 collection cycles; consider reinvestment of Oct 2026 surplus.',
    icon: TrendingUp, color: '#22d3ee', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30',
  },
  {
    type: 'watch', title: 'NPS Volatility Risk in Late 2026',
    body: 'Two consecutive anomalous NPS months in Dec 2026 (score 9.9) and Jan 2027 (score 14.6) represent the highest customer experience risk in the dataset. While overall NPS trend is mildly positive (+2.6%), this volatility window requires monitoring.',
    action: 'Deploy NPS pulse surveys in Nov–Jan cycle; investigate service degradation drivers.',
    icon: Activity, color: '#a78bfa', bg: 'bg-violet-500/10', border: 'border-violet-500/30',
  },
  {
    type: 'positive', title: 'Workforce Turnover Structurally Declining',
    body: 'Turnover rate trend declines from 1.57% (Jan 2024) to 1.07% (Dec 2025) — a 32% structural improvement. Apr/May seasonality consistently near zero. Forecast through 2025 shows no recurrence of early 2024 spikes (scores 26.4, 24.5).',
    action: 'Document current retention programs as best practice; extend to high-risk departments.',
    icon: TrendingDown, color: '#34d399', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30',
  },
  {
    type: 'action', title: 'Seasonal Dip Pre-emption Strategy',
    body: 'Revenue shows consistent -5.8% in November (driven by month-end volatility) and -1.8% in July (summer slowdown). Productivity drops -4% to -4.5% in Jul–Aug. Project completion tanks -8.1% in December. These patterns are highly predictable.',
    action: 'Pre-deploy performance incentives in Jun/Oct; defer large project milestones away from Dec.',
    icon: Calendar, color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30',
  },
];

const RecommendationCard = ({ rec }: { rec: typeof AI_RECS[0] }) => {
  const Icon = rec.icon;
  return (
    <div className={`${rec.bg} border ${rec.border} rounded-xl p-4 flex flex-col gap-3`}>
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg" style={{ background: `${rec.color}20` }}>
          <Icon className="w-4 h-4" style={{ color: rec.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              rec.type === 'critical' ? 'bg-red-500/20 text-red-600' :
              rec.type === 'watch'    ? 'bg-amber-500/20 text-amber-600' :
              rec.type === 'positive' ? 'bg-emerald-500/20 text-emerald-600' :
              'bg-indigo-500/20 text-indigo-600'
            }`}>{rec.type}</span>
          </div>
          <h4 className="text-sm font-semibold text-text-primary leading-snug">{rec.title}</h4>
        </div>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{rec.body}</p>
      <div className="bg-bg-elevated rounded-lg p-2.5">
        <p className="text-xs font-semibold text-text-secondary">
          <span style={{ color: rec.color }} className="mr-1">→</span>{rec.action}
        </p>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const CHART_TABS: { key: string; label: string; series: ForecastSeries }[] = [
  { key: 'revenue',     label: 'Revenue',          series: FORECAST_REVENUE },
  { key: 'cashflow',    label: 'Cash Flow',         series: FORECAST_CASH_FLOW },
  { key: 'productivity',label: 'Productivity',      series: FORECAST_PRODUCTIVITY },
  { key: 'turnover',    label: 'Turnover Rate',     series: FORECAST_TURNOVER },
  { key: 'csat',        label: 'CSAT',              series: FORECAST_CSAT },
  { key: 'nps',         label: 'NPS',               series: FORECAST_NPS },
  { key: 'completion',  label: 'Proj. Completion',  series: FORECAST_COMPLETION },
  { key: 'budget',      label: 'Budget Variance',   series: FORECAST_BUDGET_VARIANCE },
];

export default function ForecastingDashboardPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const activeSeries = CHART_TABS.find(t => t.key === activeTab)!.series;

  const totalAnomalies = useMemo(
    () => ALL_FORECAST_SERIES.reduce((s, ser) => s + ser.data.filter(d => d.isAnomaly && d.anomalyScore > 0).length, 0),
    []
  );
  const criticalAnomalies = useMemo(
    () => ALL_FORECAST_SERIES.reduce((s, ser) => s + ser.data.filter(d => d.isAnomaly && d.anomalyScore >= 15).length, 0),
    []
  );
  const forecastedKPIs = ALL_FORECAST_SERIES.length;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Forecasting Dashboard</h1>
            <p className="text-text-muted text-sm">Prophet-powered multi-domain KPI forecasting · 95% confidence intervals</p>
          </div>
        </div>
      </div>

      {/* ── Summary Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'KPIs Forecasted',    value: forecastedKPIs,    sub: '4 domains', color: '#6366f1', Icon: BarChart2 },
          { label: 'Total Anomalies',    value: totalAnomalies,    sub: 'across all series', color: '#f59e0b', Icon: AlertTriangle },
          { label: 'Critical Anomalies', value: criticalAnomalies, sub: 'score ≥ 15', color: '#ef4444', Icon: Zap },
          { label: 'Forecast Horizon',   value: '3+ yrs',           sub: 'Jan 2025 → Sep 2027', color: '#34d399', Icon: Target },
        ].map(({ label, value, sub, color, Icon }) => (
          <div key={label} className="bg-bg-elevated border border-bg-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-xs text-text-muted font-medium">{label}</span>
            </div>
            <p className="text-3xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-muted mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Summary Cards Grid ────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600" />
          Forecast Summary — All KPIs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FORECAST_SUMMARIES.map(s => <SummaryCard key={s.kpi} s={s} />)}
        </div>
      </div>

      {/* ── Forecast Chart (tabbed) ───────────────────────────────────────── */}
      <div className="bg-bg-elevated border border-bg-border rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Forecast Detail — {activeSeries.label}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {activeSeries.domain} · Actual (solid) vs Prophet yhat (dashed) with 95% CI band ·&nbsp;
              <span className="text-red-600">● Anomaly</span>
            </p>
          </div>
        </div>

        {/* tab selector */}
        <div className="flex flex-wrap gap-2 mb-5">
          {CHART_TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === t.key
                  ? 'text-white border-transparent'
                  : 'text-text-muted border-bg-border hover:border-slate-400'
              }`}
              style={activeTab === t.key
                ? { background: DOMAIN_COLORS[t.series.domain], borderColor: DOMAIN_COLORS[t.series.domain] }
                : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ForecastChart series={activeSeries} />

        {/* stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {(() => {
            const d = activeSeries.data;
            const actuals = d.filter(x => x.actual !== null).map(x => x.actual as number);
            const lastActual = actuals[actuals.length - 1];
            const lastYhat  = d[d.length - 1].yhat;
            const lastLower = d[d.length - 1].lower;
            const lastUpper = d[d.length - 1].upper;
            const anomCount = d.filter(x => x.isAnomaly && x.anomalyScore > 0).length;
            return [
              { label: 'Latest Actual',    value: fmtVal(lastActual, activeSeries.unit) },
              { label: 'Latest Forecast',  value: fmtVal(lastYhat,   activeSeries.unit) },
              { label: '95% CI Range',     value: `${fmtVal(lastLower, activeSeries.unit)} – ${fmtVal(lastUpper, activeSeries.unit)}` },
              { label: 'Anomalies',        value: `${anomCount}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-bg-surface rounded-xl p-3 border border-bg-border">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm font-bold text-text-primary">{value}</p>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* ── Monthly Seasonality ───────────────────────────────────────────── */}
      <div className="bg-bg-elevated border border-bg-border rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-purple-600" />
          <h2 className="text-base font-bold text-text-primary">Monthly Seasonality Patterns</h2>
        </div>
        <p className="text-xs text-text-muted mb-5">
          Typical % deviation from annual mean by month — derived from Prophet seasonal components
        </p>
        <SeasonalityChart />
      </div>

      {/* ── Two-column: anomaly table + side stats ────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">
              Forecast Anomaly Events ({totalAnomalies} total)
            </h2>
          </div>
          <AnomalyTable />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">Model Info</h2>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Algorithm',         value: 'Facebook Prophet' },
              { label: 'Confidence Level',  value: '95% (2σ)' },
              { label: 'Seasonality Mode',  value: 'Additive' },
              { label: 'Training Window',   value: 'Full historical' },
              { label: 'Domains Covered',   value: '4 (Financial, Workforce, CX, Project)' },
              { label: 'KPIs Modelled',     value: '8 KPIs' },
              { label: 'Forecast Horizon',  value: 'Up to Sep 2027' },
              { label: 'Anomaly Detection', value: 'Score = |actual − yhat| / σ' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center bg-bg-elevated rounded-lg px-4 py-3 border border-bg-border">
                <span className="text-xs text-text-muted">{label}</span>
                <span className="text-xs text-text-primary font-semibold text-right max-w-[55%]">{value}</span>
              </div>
            ))}
          </div>

          {/* domain anomaly breakdown */}
          <div className="mt-4 bg-bg-elevated border border-bg-border rounded-xl p-4">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Anomalies by Domain</p>
            {Object.entries(
              ALL_FORECAST_SERIES.reduce((acc, s) => {
                const n = s.data.filter(d => d.isAnomaly && d.anomalyScore > 0).length;
                acc[s.domain] = (acc[s.domain] ?? 0) + n;
                return acc;
              }, {} as Record<string, number>)
            ).map(([domain, count]) => (
              <div key={domain} className="flex items-center gap-3 mb-2">
                <div className="w-24 flex-shrink-0 text-xs text-text-muted truncate">{domain}</div>
                <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${(count / totalAnomalies) * 100}%`, background: DOMAIN_COLORS[domain] }}
                  />
                </div>
                <span className="text-xs text-text-primary font-bold w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}