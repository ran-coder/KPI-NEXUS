import React, { useState, useMemo } from 'react';
import { useFilterStore } from '../store';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Shield,
  Info,
  Filter,
} from 'lucide-react';
import {
  FLAGGED_KPIS,
  SEVERITY_DISTRIBUTION,
  ANOMALY_SUMMARY_STATS,
  type FlaggedKpi,
} from '../data/anomalyData';
import type { DomainType } from '../types/kpi';

// Convert "Jan 25" → "2025-01"  or  "Apr 2027" → "2027-04"
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthToISO(s: string): string {
  const parts = s.trim().split(' ');
  if (parts.length === 2) {
    const mi = MONTH_NAMES.indexOf(parts[0]);
    if (mi !== -1) {
      const yr = parts[1].length === 2 ? `20${parts[1]}` : parts[1];
      return `${yr}-${String(mi + 1).padStart(2, '0')}`;
    }
  }
  return s;
}

// ── Palette ──────────────────────────────────────────────────

const DOMAIN_COLORS: Record<DomainType | string, string> = {
  Financial:            '#4f46e5',
  Workforce:            '#0891b2',
  'Customer Experience':'#d97706',
  Project:              '#059669',
};

const SEVERITY_COLORS = {
  critical: '#ef4444',
  warning:  '#f59e0b',
  low:      '#6366f1',
} as const;

const SEVERITY_BG: Record<string, string> = {
  critical: 'bg-red-50/80 border-red-200 text-red-700',
  warning:  'bg-amber-50/80 border-amber-200 text-amber-800',
  low:      'bg-indigo-50/80 border-indigo-200 text-indigo-800',
};

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertCircle size={14} className="text-red-600" />,
  warning:  <AlertTriangle size={14} className="text-amber-600" />,
  low:      <Info size={14} className="text-indigo-600" />,
};

const DOMAIN_LIST: (DomainType | 'All')[] = [
  'All', 'Financial', 'Workforce', 'Customer Experience', 'Project',
];

// ── Custom tooltip for severity distribution ─────────────────

const SeverityTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg min-w-[160px]">
      <p className="text-slate-500 text-xs font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between items-center gap-4 text-xs py-0.5">
          <span style={{ color: p.fill || p.color }} className="capitalize font-medium">{p.name}</span>
          <span className="font-bold text-slate-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Stat card ────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-[#f8fafc] p-5 flex flex-col justify-between gap-3 shadow-sm ${accent ?? 'border-slate-200/80'}`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-xl bg-slate-100">{icon}</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        {sub && <div className="text-xs text-slate-500 font-medium mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ── Alert card for a single flagged KPI ─────────────────────

function AlertCard({ kpi }: { kpi: FlaggedKpi }) {
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 shadow-sm transition-shadow hover:shadow-md ${SEVERITY_BG[kpi.severity]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
            {SEVERITY_ICON[kpi.severity]}
            <span className={
              kpi.severity === 'critical' ? 'text-red-600' :
              kpi.severity === 'warning'  ? 'text-amber-700' :
              'text-indigo-600'
            }>
              {kpi.severity}
            </span>
          </div>
          <h4 className="text-slate-900 font-bold text-base leading-snug">{kpi.displayName}</h4>
          <span className="text-slate-500 text-xs font-medium">{kpi.domain}</span>
        </div>
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
          style={{
            borderColor: DOMAIN_COLORS[kpi.domain] + '40',
            background:  DOMAIN_COLORS[kpi.domain] + '15',
            color:       DOMAIN_COLORS[kpi.domain],
          }}
        >
          <TrendIcon size={18} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 py-2 my-1 border-y border-slate-200/60 bg-white/60 rounded-xl px-2">
        <div className="text-center">
          <div className="text-slate-900 font-bold text-base">{kpi.flagged}</div>
          <div className="text-slate-500 text-[10px] font-semibold uppercase">Flags</div>
        </div>
        <div className="text-center border-x border-slate-200/80">
          <div className="text-slate-900 font-bold text-base">{kpi.avgSeverity.toFixed(1)}</div>
          <div className="text-slate-500 text-[10px] font-semibold uppercase">Avg Severity</div>
        </div>
        <div className="text-center">
          <div className="text-slate-900 font-bold text-base">{kpi.nMonths}</div>
          <div className="text-slate-500 text-[10px] font-semibold uppercase">Months</div>
        </div>
      </div>

      <p className="text-slate-600 text-xs leading-relaxed font-normal">{kpi.description}</p>

      <div className="text-xs text-slate-500 font-medium">
        Last flagged: <span className="text-slate-800 font-semibold">{kpi.lastFlaggedMonth}</span>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────

const AnomalyDetectionPage: React.FC = () => {
  const [domainFilter, setDomainFilter] = useState<DomainType | 'All'>('All');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'critical' | 'warning' | 'low'>('All');
  const { dateRange } = useFilterStore();

  const filteredKpis = useMemo(() => {
    return FLAGGED_KPIS.filter((k) => {
      const domainOk = domainFilter === 'All' || k.domain === domainFilter;
      const sevOk    = severityFilter === 'All' || k.severity === severityFilter;
      const iso = k.lastFlaggedMonth ? monthToISO(k.lastFlaggedMonth) : null;
      const inPeriod = !iso || (iso >= dateRange.start && iso <= dateRange.end);
      return domainOk && sevOk && inPeriod;
    });
  }, [domainFilter, severityFilter, dateRange]);

  const s = ANOMALY_SUMMARY_STATS;

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-900 p-6 space-y-8">
      {/* ── Page header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Activity size={24} className="text-red-500" />
            <h1 className="text-2xl font-bold text-slate-900">Anomaly Detection</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Flagged KPI deviations across all domains — Jan 2025 – Sep 2027
          </p>
        </div>
        <div className="text-xs bg-[#f8fafc] border border-slate-200/80 shadow-xs rounded-xl px-4 py-2 text-slate-500 font-medium">
          Last updated: <span className="text-slate-900 font-semibold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* ── Summary stat cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<AlertTriangle size={18} className="text-red-500" />}
          label="Total Anomalies Flagged"
          value={s.totalFlagged}
          sub={`${s.domainsAffected} domains affected`}
          accent="border-red-200/80"
        />
        <StatCard
          icon={<AlertCircle size={18} className="text-red-500" />}
          label="Critical Severity KPIs"
          value={s.criticalCount}
          sub="Avg severity ≥ 2.0"
          accent="border-red-200/60"
        />
        <StatCard
          icon={<Shield size={18} className="text-amber-500" />}
          label="Warning Severity KPIs"
          value={s.warningCount}
          sub="Avg severity 1.0 – 1.9"
          accent="border-amber-200/60"
        />
        <StatCard
          icon={<Activity size={18} className="text-indigo-500" />}
          label="Highest Severity Score"
          value={s.highestSeverityScore}
          sub={s.highestSeverityKpi}
          accent="border-indigo-200/60"
        />
      </div>

      {/* ── Severity distribution ─────────────────────────────── */}
      <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Severity Distribution by Domain</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Breakdown of critical / warning / low anomalies per domain</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart
            data={SEVERITY_DISTRIBUTION}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="domain"
              tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={160}
            />
            <Tooltip content={<SeverityTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(v) => <span style={{ color: '#475569', fontWeight: 500 }}>{v}</span>}
            />
            <Bar dataKey="critical" name="Critical" stackId="s" fill={SEVERITY_COLORS.critical} />
            <Bar dataKey="warning"  name="Warning"  stackId="s" fill={SEVERITY_COLORS.warning} />
            <Bar dataKey="low"      name="Low"      stackId="s" fill={SEVERITY_COLORS.low} radius={[0,4,4,0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Alert Cards: filters + grid ──────────────────────── */}
      <div>
        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Filter size={14} />
            <span>Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DOMAIN_LIST.map((d) => (
              <button
                key={d}
                onClick={() => setDomainFilter(d as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  domainFilter === d
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-slate-300 mx-1 hidden sm:block" />
          <div className="flex flex-wrap gap-2">
            {(['All', 'critical', 'warning', 'low'] as const).map((sv) => (
              <button
                key={sv}
                onClick={() => setSeverityFilter(sv)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize ${
                  severityFilter === sv
                    ? sv === 'critical' ? 'bg-red-600 border-red-600 text-white shadow-xs'
                      : sv === 'warning' ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {sv}
              </button>
            ))}
          </div>
        </div>

        {/* heading */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Alert Cards</h2>
          <span className="text-xs font-medium text-slate-500 bg-[#f8fafc] border border-slate-200/80 px-3 py-1 rounded-full shadow-xs">
            {filteredKpis.length} of {FLAGGED_KPIS.length} KPIs
          </span>
        </div>

        {/* card grid */}
        {filteredKpis.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-medium bg-[#f8fafc] border border-slate-200/80 rounded-2xl">
            No KPIs match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredKpis.map((kpi) => (
              <AlertCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyDetectionPage;