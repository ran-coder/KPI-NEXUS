import React, { useState, useMemo } from 'react';
import { useFilterStore } from '../store';
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
  DollarSign,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import {
  FINANCIAL_MONTHLY,
  FINANCIAL_FORECAST,
  FINANCIAL_ANOMALY_EVENTS,
  FINANCIAL_SUMMARY,
  type FinancialAnomalyEvent,
} from '../data/financialData';

// ── Colour palette (matches KPI Nexus design system) ────────────────────────

const C = {
  revenue:     '#6366f1',   // indigo
  cashFlow:    '#22d3ee',   // cyan
  netIncome:   '#34d399',   // emerald
  expenditure: '#f59e0b',   // amber
  margin:      '#a78bfa',   // violet
  forecast:    '#6366f1',
  band:        '#6366f1',
} as const;

const SEV_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    text: 'text-red-600',
    icon: <AlertCircle size={14} className="text-red-600 shrink-0" />,
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    text: 'text-amber-600',
    icon: <AlertTriangle size={14} className="text-amber-600 shrink-0" />,
  },
  low: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/40',
    text: 'text-indigo-600',
    icon: <Info size={14} className="text-indigo-600 shrink-0" />,
  },
};

// ── Utility formatters ────────────────────────────────────────────────────────

const fmt$ = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(2)}M`
    : `$${(v / 1_000).toFixed(1)}K`;

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtNum = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 });

function DeltaBadge({ value, unit = '%' }: { value: number; unit?: string }) {
  if (Math.abs(value) < 0.01)
    return <span className="flex items-center gap-0.5 text-xs text-text-muted"><Minus size={10} />0{unit}</span>;
  const up = value > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-600'}`}>
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(value).toFixed(1)}{unit}
    </span>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-3 shadow-elevated text-xs min-w-[160px]">
      <p className="text-text-muted font-medium mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between items-center gap-4 py-0.5">
          <span style={{ color: p.stroke || p.fill || p.color }} className="capitalize">{p.name}</span>
          <span className="font-semibold text-text-primary">
            {valueFormatter ? valueFormatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ForecastTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const yhat = payload.find((p: any) => p.name === 'revenue_yhat' || p.name === 'cashFlow_yhat');
  const lower = payload.find((p: any) => p.name === 'revenue_lower' || p.name === 'cashFlow_lower');
  const upper = payload.find((p: any) => p.name === 'revenue_upper' || p.name === 'cashFlow_upper');
  const actual = payload.find((p: any) => p.name === 'revenue_actual' || p.name === 'cashFlow_actual');
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-3 shadow-elevated text-xs min-w-[170px]">
      <p className="text-text-muted font-medium mb-2">{label}</p>
      {actual?.value != null && (
        <div className="flex justify-between gap-4 py-0.5">
          <span className="text-text-secondary">Actual</span>
          <span className="font-semibold text-text-primary">{fmt$(actual.value)}</span>
        </div>
      )}
      {yhat && (
        <div className="flex justify-between gap-4 py-0.5">
          <span style={{ color: C.forecast }}>Forecast</span>
          <span className="font-semibold text-text-primary">{fmt$(yhat.value)}</span>
        </div>
      )}
      {lower && upper && (
        <div className="flex justify-between gap-4 py-0.5 text-text-muted">
          <span>95% band</span>
          <span>{fmt$(lower.value)} – {fmt$(upper.value)}</span>
        </div>
      )}
    </div>
  );
}

// ── KPI Stat Card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  momChange: number;
  yoyChange: number;
  icon: React.ReactNode;
  accentColor: string;
  unit?: string;
}

function StatCard({ label, value, momChange, yoyChange, icon, accentColor, unit }: StatCardProps) {
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accentColor}20`, color: accentColor }}
        >
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-text-muted">MoM</span>
          <DeltaBadge value={momChange} unit={unit ?? '%'} />
        </div>
        <div className="h-6 w-px bg-bg-border" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-text-muted">YoY</span>
          <DeltaBadge value={yoyChange} unit={unit ?? '%'} />
        </div>
      </div>
    </div>
  );
}

// ── Section Wrapper ───────────────────────────────────────────────────────────

function Section({
  title, subtitle, icon, children, rightContent,
}: {
  title: string; subtitle?: string; icon?: React.ReactNode;
  children: React.ReactNode; rightContent?: React.ReactNode;
}) {
  return (
    <section className="bg-bg-elevated border border-bg-border rounded-2xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-bg-border">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-base text-text-secondary">
              {icon}
            </span>
          )}
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
            {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {rightContent && <div className="shrink-0">{rightContent}</div>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

// ── Anomaly Row ───────────────────────────────────────────────────────────────

function AnomalyRow({ event, expanded, onToggle }: {
  event: FinancialAnomalyEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const s = SEV_STYLES[event.severity];
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${s.border} ${expanded ? s.bg : 'bg-transparent'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/5 transition-colors"
      >
        {s.icon}
        <div className="flex-1 grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-6 items-center min-w-0">
          <span className="text-xs font-medium text-text-primary truncate">{event.kpiLabel}</span>
          <span className="text-xs text-text-muted">{event.month}</span>
          <span className="text-xs font-mono font-semibold text-text-primary">{event.value}</span>
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${s.border} ${s.bg} ${s.text}`}>
            {event.severity}
          </span>
          {expanded
            ? <ChevronUp size={14} className="text-text-muted" />
            : <ChevronDown size={14} className="text-text-muted" />
          }
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-3 ml-5 text-xs text-text-secondary leading-relaxed border-t border-bg-border pt-2.5">
          {event.note}
        </div>
      )}
    </div>
  );
}

// ── Executive Insights ────────────────────────────────────────────────────────

const INSIGHTS = [
  {
    type: 'warning' as const,
    headline: 'Debt-to-Equity ratio crossed 2.0 threshold',
    detail: 'Sep 2027 D/E hit 2.112 — the highest in the 33-month dataset. Monitor leverage carefully heading into Q4 2027 as rising debt servicing could compress net income.',
  },
  {
    type: 'critical' as const,
    headline: 'Jul 2026 revenue crash requires root-cause review',
    detail: 'Revenue fell 33% in a single month (Jun $89.1K → Jul $59.4K). Two KPIs flagged simultaneously. Cross-domain analysis links this to concurrent project spend reduction, suggesting a demand-side driver.',
  },
  {
    type: 'positive' as const,
    headline: 'Cash flow resilience despite revenue volatility',
    detail: 'Cash flow maintained a floor above $61.5K across all 33 months and peaked at $86.9K in Oct 2026. The cash conversion cycle is healthy — cash flow tracked or exceeded net income in 28 of 33 months.',
  },
  {
    type: 'warning' as const,
    headline: 'Nov 2025 revenue anomaly likely a reporting gap',
    detail: 'Revenue dropped to $58.6K in Nov 2025 — the only sub-$60K month before the Jul 2026 event. Profit margin held at 51.7%, suggesting the revenue figure may reflect a timing or classification issue.',
  },
  {
    type: 'positive' as const,
    headline: 'Profit margin stable in 47–57% band',
    detail: 'Despite revenue volatility, average profit margin remained within a healthy 47.5–56.5% range across all periods. No structural margin compression detected — costs are well managed.',
  },
  {
    type: 'action' as const,
    headline: 'Recommended: Set cash flow floor covenant at $65K',
    detail: 'Cross-domain analysis (Granger causality, p=0.005) shows cash flow decline leads to CSAT deterioration. A minimum $65K/month cash flow floor protects customer service quality during constrained periods.',
  },
];

const INSIGHT_STYLES = {
  critical: { bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: <AlertCircle size={15} className="text-red-600 mt-0.5 shrink-0" />, label: 'CRITICAL' },
  warning:  { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />, label: 'WATCH' },
  positive: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <TrendingUp size={15} className="text-emerald-600 mt-0.5 shrink-0" />, label: 'POSITIVE' },
  action:   { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30',  icon: <Zap size={15} className="text-indigo-600 mt-0.5 shrink-0" />, label: 'ACTION' },
};

// ── Main Page Component ───────────────────────────────────────────────────────

export default function FinancialDashboardPage() {
  const [expandedAnomaly, setExpandedAnomaly] = useState<number | null>(null);
  const [sevFilter, setSevFilter] = useState<'all' | 'critical' | 'warning' | 'low'>('all');
  const [forecastMetric, setForecastMetric] = useState<'revenue' | 'cashFlow'>('revenue');
  const { dateRange } = useFilterStore();

  const { revenue, cashFlow, netIncome, profitMargin, expenditure, debtToEquity, latestMonth } = FINANCIAL_SUMMARY;

  // Trend data – filtered by dateRange from TopBar period selector
  const trendData = useMemo(() =>
    FINANCIAL_MONTHLY
      .filter(r => r.date.slice(0, 7) >= dateRange.start && r.date.slice(0, 7) <= dateRange.end)
      .map(r => ({
        month: r.month,
        Revenue:     r.revenue,
        'Cash Flow': r.cashFlow,
        'Net Income':r.netIncome,
        Expenditure: r.expenditure,
        'Profit Margin': +(r.profitMargin * 100).toFixed(1),
        'Anomaly Count': r.anomalyCount,
      })),
    [dateRange]
  );

  // Forecast chart data – also filtered by period
  const forecastData = useMemo(() =>
    FINANCIAL_FORECAST
      .filter(r => r.date.slice(0, 7) >= dateRange.start && r.date.slice(0, 7) <= dateRange.end)
      .map(r => ({
        month: r.month,
        revenue_actual:   r.revenue_actual,
        cashFlow_actual:  r.cashFlow_actual,
        revenue_yhat:     r.revenue_yhat,
        revenue_lower:    r.revenue_lower,
        revenue_upper:    r.revenue_upper,
        cashFlow_yhat:    r.cashFlow_yhat,
        cashFlow_lower:   r.cashFlow_lower,
        cashFlow_upper:   r.cashFlow_upper,
        isForecast:       r.isForecast,
      })),
    [dateRange]
  );

  // Filtered anomaly events
  const filteredAnomalies = useMemo(
    () => FINANCIAL_ANOMALY_EVENTS
      .filter(e => {
        const inPeriod = e.date.slice(0, 7) >= dateRange.start && e.date.slice(0, 7) <= dateRange.end;
        const inSev = sevFilter === 'all' || e.severity === sevFilter;
        return inPeriod && inSev;
      }),
    [sevFilter, dateRange]
  );

  // X-axis tick (show every 4th to prevent overlap)
  const tickFormatter = (_: string, idx: number) => (idx % 4 === 0 ? _ : '');

  return (
    <div className="space-y-6 p-6">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Financial Dashboard</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Jan 2025 – Sep 2027 &nbsp;·&nbsp; All Accounts &nbsp;·&nbsp; Latest: <span className="text-text-secondary font-medium">{latestMonth}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5">
          <ShieldAlert size={13} className="text-amber-600" />
          <span>
            <span className="font-semibold text-amber-600">{FINANCIAL_SUMMARY.criticalCount} Critical</span>
            &nbsp;·&nbsp;
            <span className="font-semibold text-amber-500">{FINANCIAL_SUMMARY.warningCount} Warning</span>
            &nbsp;anomalies detected
          </span>
        </div>
      </div>

      {/* ── KPI Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Revenue"
          value={fmt$(revenue.value)}
          momChange={revenue.momChange}
          yoyChange={revenue.yoyChange}
          icon={<DollarSign size={16} />}
          accentColor={C.revenue}
        />
        <StatCard
          label="Cash Flow"
          value={fmt$(cashFlow.value)}
          momChange={cashFlow.momChange}
          yoyChange={cashFlow.yoyChange}
          icon={<Activity size={16} />}
          accentColor={C.cashFlow}
        />
        <StatCard
          label="Net Income"
          value={fmt$(netIncome.value)}
          momChange={netIncome.momChange}
          yoyChange={netIncome.yoyChange}
          icon={<TrendingUp size={16} />}
          accentColor={C.netIncome}
        />
        <StatCard
          label="Profit Margin"
          value={fmtPct(profitMargin.value)}
          momChange={profitMargin.momChange}
          yoyChange={profitMargin.yoyChange}
          icon={<BarChart2 size={16} />}
          accentColor={C.margin}
          unit="pp"
        />
        <StatCard
          label="Expenditure"
          value={fmt$(expenditure.value)}
          momChange={expenditure.momChange}
          yoyChange={expenditure.yoyChange}
          icon={<TrendingDown size={16} />}
          accentColor={C.expenditure}
        />
        <StatCard
          label="Debt / Equity"
          value={debtToEquity.value.toFixed(3)}
          momChange={debtToEquity.momChange}
          yoyChange={debtToEquity.yoyChange}
          icon={<AlertTriangle size={16} />}
          accentColor="#DC2626"
          unit="x"
        />
      </div>

      {/* ── Revenue & Expenditure Trend ──────────────────────────── */}
      <Section
        title="Revenue & Expenditure Trend"
        subtitle="Monthly Total Revenue vs Total Expenditure (Jan 2025 – Sep 2027)"
        icon={<TrendingUp size={15} />}
      >
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.revenue} stopOpacity={0.25} />
                <stop offset="95%" stopColor={C.revenue} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradExpenditure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.expenditure} stopOpacity={0.18} />
                <stop offset="95%" stopColor={C.expenditure} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
            <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={tickFormatter} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ChartTooltip valueFormatter={fmt$} />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            <Area type="monotone" dataKey="Revenue"     stroke={C.revenue}      strokeWidth={2} fill="url(#gradRevenue)"      dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="Expenditure" stroke={C.expenditure}  strokeWidth={1.5} fill="url(#gradExpenditure)" dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Cash Flow & Net Income ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="Cash Flow Trend"
          subtitle="Monthly Total Cash Flow (Jan 2025 – Sep 2027)"
          icon={<Activity size={15} />}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.cashFlow} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={C.cashFlow} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={tickFormatter} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={48} />
              <ReferenceLine y={65000} stroke="#DC2626" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Floor $65K', fill: '#DC2626', fontSize: 10, position: 'insideTopRight' }} />
              <Tooltip content={<ChartTooltip valueFormatter={fmt$} />} />
              <Area type="monotone" dataKey="Cash Flow" stroke={C.cashFlow} strokeWidth={2} fill="url(#gradCF)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        <Section
          title="Net Income Trend"
          subtitle="Monthly Total Net Income (Jan 2025 – Sep 2027)"
          icon={<TrendingUp size={15} />}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradNI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.netIncome} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={C.netIncome} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={tickFormatter} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<ChartTooltip valueFormatter={fmt$} />} />
              <Area type="monotone" dataKey="Net Income" stroke={C.netIncome} strokeWidth={2} fill="url(#gradNI)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* ── Profit Margin Trend ───────────────────────────────────── */}
      <Section
        title="Profit Margin Trend"
        subtitle="Monthly Avg Profit Margin % (Jan 2025 – Sep 2027)"
        icon={<BarChart2 size={15} />}
      >
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
            <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={tickFormatter} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickFormatter={v => `${v}%`}
              domain={[35, 65]}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <ReferenceLine y={50} stroke="rgba(15, 23, 42, 0.15)" strokeDasharray="4 2" strokeWidth={1} label={{ value: '50%', fill: '#64748B', fontSize: 10 }} />
            <Tooltip content={<ChartTooltip valueFormatter={(v: number) => `${v}%`} />} />
            <Bar dataKey="Profit Margin" fill={C.margin} opacity={0.75} radius={[3,3,0,0]} maxBarSize={16}>
              {trendData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry['Profit Margin'] < 47 ? '#DC2626' : entry['Profit Margin'] < 50 ? '#D97706' : C.margin}
                />
              ))}
            </Bar>
            <Line type="monotone" dataKey="Profit Margin" stroke={C.margin} strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Prophet Forecast Chart ────────────────────────────────── */}
      <Section
        title="Prophet Forecast — 6-Month Outlook"
        subtitle="Prophet-based forecast with 95% confidence band (Oct 2027 – Mar 2028)"
        icon={<Zap size={15} />}
        rightContent={
          <div className="flex rounded-lg overflow-hidden border border-bg-border text-xs">
            {(['revenue', 'cashFlow'] as const).map(m => (
              <button
                key={m}
                onClick={() => setForecastMetric(m)}
                className={`px-3 py-1.5 transition-colors ${forecastMetric === m ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-primary'}`}
              >
                {m === 'revenue' ? 'Revenue' : 'Cash Flow'}
              </button>
            ))}
          </div>
        }
      >
        <div className="flex items-center gap-6 mb-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 bg-indigo-500" />
            Forecast (yhat)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 bg-indigo-500 opacity-30" />
            95% Confidence Band
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-slate-200 border border-slate-300" />
            Actual (overlap)
          </span>
          <span className="flex items-center gap-1.5 text-amber-600">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/30" />
            Forecast period
          </span>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={forecastData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.band} stopOpacity={0.20} />
                <stop offset="95%" stopColor={C.band} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
            <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<ForecastTooltip />} />

            {/* Confidence band rendered as upper – lower area fill */}
            <Area
              type="monotone"
              dataKey={forecastMetric === 'revenue' ? 'revenue_upper' : 'cashFlow_upper'}
              stroke="none"
              fill="url(#gradBand)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey={forecastMetric === 'revenue' ? 'revenue_lower' : 'cashFlow_lower'}
              stroke="none"
              fill="#F1F5F9"
              isAnimationActive={false}
            />

            {/* Forecast yhat line */}
            <Line
              type="monotone"
              dataKey={forecastMetric === 'revenue' ? 'revenue_yhat' : 'cashFlow_yhat'}
              stroke={C.forecast}
              strokeWidth={2}
              dot={false}
              strokeDasharray="6 3"
            />

            {/* Actual values */}
            <Line
              type="monotone"
              dataKey={forecastMetric === 'revenue' ? 'revenue_actual' : 'cashFlow_actual'}
              stroke={forecastMetric === 'revenue' ? C.revenue : C.cashFlow}
              strokeWidth={2.5}
              dot={{ r: 3, fill: forecastMetric === 'revenue' ? C.revenue : C.cashFlow }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Anomaly Table ─────────────────────────────────────────── */}
      <Section
        title="Financial Anomaly Events"
        subtitle={`${FINANCIAL_ANOMALY_EVENTS.length} flagged events across 33 months — click any row to expand`}
        icon={<AlertCircle size={15} />}
        rightContent={
          <div className="flex rounded-lg overflow-hidden border border-bg-border text-xs">
            {(['all', 'critical', 'warning', 'low'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                className={`px-3 py-1.5 capitalize transition-colors ${sevFilter === s ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-primary'}`}
              >
                {s === 'all' ? `All (${FINANCIAL_ANOMALY_EVENTS.length})` : s}
              </button>
            ))}
          </div>
        }
      >
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-6 px-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted border-b border-bg-border">
          <span>KPI</span>
          <span>Month</span>
          <span>Value</span>
          <span>Severity</span>
          <span />
        </div>
        <div className="mt-2 space-y-1.5">
          {filteredAnomalies.length === 0 && (
            <p className="text-center text-xs text-text-muted py-8">No events match the selected filter.</p>
          )}
          {filteredAnomalies.map((event, i) => (
            <AnomalyRow
              key={event.date + event.kpi}
              event={event}
              expanded={expandedAnomaly === i}
              onToggle={() => setExpandedAnomaly(expandedAnomaly === i ? null : i)}
            />
          ))}
        </div>
      </Section>

      {/* ── Executive Insights ────────────────────────────────────── */}
      <Section
        title="Executive Insights"
        subtitle="AI-synthesised findings from Financial KPI analysis"
        icon={<Zap size={15} />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INSIGHTS.map((ins, i) => {
            const st = INSIGHT_STYLES[ins.type];
            return (
              <div
                key={i}
                className={`rounded-xl border p-4 flex flex-col gap-2 ${st.bg} ${st.border}`}
              >
                <div className="flex items-start gap-2">
                  {st.icon}
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      ins.type === 'critical' ? 'text-red-600'
                      : ins.type === 'warning' ? 'text-amber-600'
                      : ins.type === 'positive' ? 'text-emerald-600'
                      : 'text-indigo-600'
                    }`}>{st.label}</span>
                    <p className="text-xs font-semibold text-text-primary mt-0.5 leading-snug">{ins.headline}</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed pl-5">{ins.detail}</p>
              </div>
            );
          })}
        </div>
      </Section>

    </div>
  );
}