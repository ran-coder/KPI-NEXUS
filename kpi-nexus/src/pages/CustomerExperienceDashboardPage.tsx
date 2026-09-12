import React, { useState, useMemo } from 'react';
import { useFilterStore } from '../store';

// Convert "Jan 2025" or "Nov 2025" → "2025-01" for dateRange comparison
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthToISO(s: string): string {
  const parts = s.trim().split(' ');
  if (parts.length === 2) {
    const mi = MONTH_NAMES.indexOf(parts[0]);
    if (mi !== -1) return `${parts[1]}-${String(mi + 1).padStart(2, '0')}`;
  }
  return s;
}

import {
  AreaChart,
  Area,
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
  Star,
  ThumbsUp,
  Clock,
  Ticket,
  UserX,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  CX_MONTHLY,
  CX_SUMMARY,
  CX_ANOMALY_EVENTS,
  CSAT_FORECAST,
  NPS_FORECAST,
  RESPONSE_FORECAST,
  type CxAnomalyEvent,
} from '../data/customerExperienceData';

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  csat:         '#4f46e5',  // indigo-600
  nps:          '#0284c7',  // sky-600
  response:     '#d97706',  // amber-600
  tickets:      '#7c3aed',  // violet-600
  churn:        '#dc2626',  // red-600
  severity:     '#ea580c',  // orange-600
  forecast:     '#4f46e5',
  band:         '#4f46e5',
} as const;

const SEV_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: <AlertCircle size={14} className="text-red-600 shrink-0" />,
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: <AlertTriangle size={14} className="text-amber-600 shrink-0" />,
  },
  low: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    icon: <Info size={14} className="text-indigo-600 shrink-0" />,
  },
};

// ── Tick formatter (abbreviated months) ──────────────────────────────────────
const shortMonth = (v: string) => v.replace(' 20', "'");

// ── Trend delta helper ────────────────────────────────────────────────────────
function delta(current: number, prev: number, invertGood = false) {
  const pct = ((current - prev) / Math.abs(prev)) * 100;
  const isGood = invertGood ? pct <= 0 : pct >= 0;
  return { pct, isGood };
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Stat Card
// ─────────────────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  subLabel?: string;
  mom: number;
  yoy: number;
  invertGood?: boolean;
  icon: React.ReactNode;
  accent: string;
  target?: string;
  targetMet?: boolean;
}

function KpiCard({ label, value, subLabel, mom, yoy, invertGood = false, icon, accent, target, targetMet }: KpiCardProps) {
  const momGood = invertGood ? mom <= 0 : mom >= 0;
  const yoyGood = invertGood ? yoy <= 0 : yoy >= 0;

  const Badge = ({ val, good, prefix }: { val: number; good: boolean; prefix: string }) => (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${good ? 'text-emerald-600' : 'text-red-600'}`}>
      {good ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {prefix} {Math.abs(val).toFixed(1)}%
    </span>
  );

  return (
    <div className="relative bg-bg-surface border border-bg-border rounded-card p-5 overflow-hidden group hover:border-text-secondary/30 transition-all shadow-sm">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
           style={{ background: `radial-gradient(circle at 70% 30%, ${accent}0D 0%, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${accent}15` }}>
            <div style={{ color: accent }}>{icon}</div>
          </div>
          {target && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${targetMet ? 'text-emerald-700 border-emerald-300 bg-emerald-50' : 'text-amber-700 border-amber-300 bg-amber-50'}`}>
              Target: {target}
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">{label}</p>
        <p className="text-2xl font-bold text-text-primary mb-0.5">{value}</p>
        {subLabel && <p className="text-xs text-text-muted mb-2">{subLabel}</p>}
        <div className="flex items-center gap-3 mt-2">
          <Badge val={mom} good={momGood} prefix="MoM" />
          <Badge val={yoy} good={yoyGood} prefix="YoY" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      {icon && (
        <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg mt-0.5">
          <div className="text-indigo-600">{icon}</div>
        </div>
      )}
      <div>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Anomaly Row
// ─────────────────────────────────────────────────────────────────────────────
function AnomalyRow({ ev }: { ev: CxAnomalyEvent }) {
  const [open, setOpen] = useState(false);
  const s = SEV_STYLES[ev.severity];
  return (
    <div className={`rounded-lg border ${s.bg} ${s.border} overflow-hidden transition-all shadow-sm`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/5 transition-colors"
      >
        {s.icon}
        <span className={`text-xs font-bold uppercase tracking-wider w-14 shrink-0 ${s.text}`}>
          {ev.severity}
        </span>
        <span className="text-xs text-text-secondary w-20 shrink-0">{ev.date}</span>
        <span className="text-xs text-indigo-900 font-medium w-36 shrink-0 truncate">{ev.kpi}</span>
        <span className="text-xs font-semibold text-text-primary w-20 shrink-0">{ev.value}</span>
        <span className={`text-xs font-medium shrink-0 ${ev.deviation.startsWith('+') ? 'text-red-600' : 'text-emerald-600'}`}>
          {ev.deviation}
        </span>
        <span className="ml-auto text-text-muted">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-black/5 pt-3 bg-white/50">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">Impact</p>
            <p className="text-xs text-text-primary leading-relaxed">{ev.impact}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">Recommendation</p>
            <p className="text-xs text-sky-800 leading-relaxed font-medium">{ev.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Recommendation Card
// ─────────────────────────────────────────────────────────────────────────────
const AI_RECOMMENDATIONS = [
  {
    type: 'critical' as const,
    title: 'Churn Rate at Dataset Maximum',
    body: 'Jul 2027 churn hit 8.2% — 105% above expected baseline. Two critical spikes in Feb and Jul 2027 indicate an emerging structural retention problem, not isolated incidents. Immediate root-cause analysis of 2027 cohort is required.',
    action: 'Launch churn deep-dive within 14 days. Segment churned accounts by tenure, product tier, and last support interaction.',
  },
  {
    type: 'critical' as const,
    title: 'Seasonal Q4 Surge — Structural Vulnerability',
    body: 'Both Nov 2025 and Nov 2026 recorded 25-30%+ response time spikes and 60%+ ticket volume surges. This is a confirmed seasonal structural risk, not a one-off. Without proactive capacity planning, 2027 Q4 will repeat the same pattern.',
    action: 'Activate Q4 surge staffing model by September. Deploy self-service KB expansion and chatbot triage for top-5 ticket categories.',
  },
  {
    type: 'watch' as const,
    title: 'Q1 NPS Seasonal Dip Pattern',
    body: 'NPS has dropped to 54-56 range in Q1 across both 2025 and 2026 (Mar 2025: 54.32, Mar 2026: 56.04). A Q1 2027 proactive campaign may prevent the same dip materializing in the forecast window.',
    action: 'Launch "Voice of Customer" initiative in February. Deploy re-engagement outreach to at-risk accounts before the dip window.',
  },
  {
    type: 'positive' as const,
    title: 'Response Time Improvement in 2027',
    body: 'Average response time has consistently trended downward in H1 2027 (hitting 38.7 min in Apr — dataset low), representing a 25% improvement vs Q4 2025 peak. Operational efficiency gains are measurable.',
    action: 'Document and codify the process improvements that drove H1 2027 performance. Protect these gains during upcoming Q4 surge.',
  },
  {
    type: 'watch' as const,
    title: 'Aug 2027 Response Time Spike',
    body: 'Response time jumped to 54.2 min in Aug 2027 — 39% above the July value and well above the H1 2027 average. While CSAT held relatively stable, this spike warrants investigation before it becomes a churn driver.',
    action: 'Audit Aug 2027 ticket queue for category distribution. Verify whether a staffing gap or product issue drove the spike.',
  },
  {
    type: 'action' as const,
    title: 'NPS Target Gap: 63.82 vs 65 Target',
    body: 'Current NPS of 63.82 is 1.18 points below the target of 65. The 2027 trajectory shows positive momentum (Apr 2027: 60.9 -> Sep 2027: 63.82). Sustained improvement will require active promoter cultivation and detractor resolution.',
    action: 'Identify top 20% NPS promoters and activate referral program. Run targeted detractor resolution workflow for accounts scoring 6 or below.',
  },
];

const REC_STYLES = {
  critical: { border: 'border-red-200', bg: 'bg-red-50/60', accent: 'text-red-600', badge: 'bg-red-100 text-red-700 border-red-200', icon: <ShieldAlert size={16} /> },
  watch:    { border: 'border-amber-200', bg: 'bg-amber-50/60', accent: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertTriangle size={16} /> },
  positive: { border: 'border-emerald-200', bg: 'bg-emerald-50/60', accent: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <TrendingUp size={16} /> },
  action:   { border: 'border-indigo-200', bg: 'bg-indigo-50/60', accent: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <Zap size={16} /> },
};

function RecommendationCard({ rec }: { rec: typeof AI_RECOMMENDATIONS[0] }) {
  const s = REC_STYLES[rec.type];
  return (
    <div className={`rounded-card border ${s.border} ${s.bg} p-4 space-y-2 shadow-sm`}>
      <div className="flex items-center gap-2">
        <span className={`${s.accent}`}>{s.icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.badge}`}>
          {rec.type}
        </span>
      </div>
      <p className="text-sm font-semibold text-text-primary">{rec.title}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{rec.body}</p>
      <div className="bg-bg-surface/80 rounded-lg px-3 py-2 border border-bg-border shadow-xs">
        <p className="text-xs text-sky-900 leading-relaxed font-medium">
          <span className="font-bold text-sky-950">Action: </span>{rec.action}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-surface border border-bg-border rounded-lg p-3 text-xs shadow-md">
      <p className="font-bold text-text-primary mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }} className="capitalize font-medium">{p.name}</span>
          <span className="font-bold text-text-primary">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
type ForecastKey = 'csat' | 'nps' | 'response';
type SevFilter = 'all' | 'critical' | 'warning' | 'low';

export default function CustomerExperienceDashboardPage() {
  const [forecastKey, setForecastKey] = useState<ForecastKey>('csat');
  const [sevFilter, setSevFilter] = useState<SevFilter>('all');
  const [expandAll, setExpandAll] = useState(false);
  const { dateRange } = useFilterStore();

  // ── KPI card calculations ─────────────────────────────────────────────────
  const { csat, nps, responseTime, supportTickets, churnRate, severityScore } = CX_SUMMARY;

  const csatMoM = delta(csat.current, csat.prevMonth);
  const csatYoY = delta(csat.current, csat.prevYear);
  const npsMoM  = delta(nps.current, nps.prevMonth);
  const npsYoY  = delta(nps.current, nps.prevYear);
  const rtMoM   = delta(responseTime.current, responseTime.prevMonth, true);
  const rtYoY   = delta(responseTime.current, responseTime.prevYear, true);
  const tkMoM   = delta(supportTickets.current, supportTickets.prevMonth, true);
  const tkYoY   = delta(supportTickets.current, supportTickets.prevYear, true);
  const chMoM   = delta(churnRate.current, churnRate.prevMonth, true);
  const chYoY   = delta(churnRate.current, churnRate.prevYear, true);
  const svMoM   = delta(severityScore.current, severityScore.prevMonth, true);
  const svYoY   = delta(severityScore.current, severityScore.prevYear, true);

  // ── Period-filtered monthly data ──────────────────────────────────────────
  const filteredMonthly = useMemo(() =>
    CX_MONTHLY.filter(r => {
      const iso = monthToISO(r.month);
      return iso >= dateRange.start && iso <= dateRange.end;
    }),
    [dateRange]);

  // ── Filtered anomalies ────────────────────────────────────────────────────
  const filteredAnomalies = useMemo(() =>
    CX_ANOMALY_EVENTS.filter(e => {
      const inPeriod = monthToISO(e.date) >= dateRange.start && monthToISO(e.date) <= dateRange.end;
      const inSev = sevFilter === 'all' || e.severity === sevFilter;
      return inPeriod && inSev;
    }),
    [sevFilter, dateRange]);

  // ── Forecast dataset (also filtered by period) ───────────────────────────
  const forecastData = useMemo(() => {
    const raw = { csat: CSAT_FORECAST, nps: NPS_FORECAST, response: RESPONSE_FORECAST }[forecastKey];
    return raw.filter(r => {
      const iso = monthToISO(r.month);
      return iso >= dateRange.start && iso <= dateRange.end;
    });
  }, [forecastKey, dateRange]);
  const forecastLabel = { csat: 'CSAT Score', nps: 'NPS Score', response: 'Response Time (min)' }[forecastKey];
  const forecastColor = { csat: C.csat, nps: C.nps, response: C.response }[forecastKey];

  // ── Churn bar colour ──────────────────────────────────────────────────────
  const churnBarColor = (rate: number) =>
    rate < 3 ? '#0284c7' : rate < 5 ? '#d97706' : '#dc2626';

  // ── Ticket bar colour ─────────────────────────────────────────────────────
  const ticketBarColor = (v: number) =>
    v < 500 ? '#4f46e5' : v < 800 ? '#d97706' : '#dc2626';

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl">
            <Star size={20} className="text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Customer Experience Dashboard</h1>
            <p className="text-xs text-text-secondary">Jan 2025 – Sep 2027 &bull; 33 months &bull; Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
        {/* Summary strip */}
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Anomalies', value: String(CX_SUMMARY.totalAnomalies), color: 'text-red-600' },
            { label: 'Avg Anomaly Rate', value: CX_SUMMARY.avgAnomalyRate, color: 'text-amber-600' },
            { label: 'Trend Anomalies', value: String(CX_SUMMARY.trendAnomalies), color: 'text-violet-600' },
            { label: 'High-Severity Months', value: String(CX_SUMMARY.highSeverityMonths), color: 'text-red-600' },
          ].map(item => (
            <div key={item.label} className="bg-bg-surface border border-bg-border rounded-card px-4 py-2.5 shadow-sm">
              <p className="text-xs font-semibold text-text-secondary">{item.label}</p>
              <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Key Performance Indicators" subtitle="Latest month: Sep 2027" icon={<Activity size={16} />} />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label="CSAT Score"
            value={csat.current.toFixed(2)}
            subLabel="out of 5.0"
            mom={csatMoM.pct} yoy={csatYoY.pct}
            icon={<Star size={18} />} accent={C.csat}
            target={`${csat.target}/5`} targetMet={csat.current >= csat.target}
          />
          <KpiCard
            label="NPS Score"
            value={nps.current.toFixed(1)}
            subLabel="0–100 scale"
            mom={npsMoM.pct} yoy={npsYoY.pct}
            icon={<ThumbsUp size={18} />} accent={C.nps}
            target={String(nps.target)} targetMet={nps.current >= nps.target}
          />
          <KpiCard
            label="Avg Response Time"
            value={`${responseTime.current} min`}
            subLabel="lower is better"
            mom={rtMoM.pct} yoy={rtYoY.pct}
            invertGood
            icon={<Clock size={18} />} accent={C.response}
            target={`${responseTime.target} min`} targetMet={responseTime.current <= responseTime.target}
          />
          <KpiCard
            label="Support Tickets"
            value={supportTickets.current.toLocaleString()}
            subLabel="this month"
            mom={tkMoM.pct} yoy={tkYoY.pct}
            invertGood
            icon={<Ticket size={18} />} accent={C.tickets}
            target={String(supportTickets.target)} targetMet={supportTickets.current <= supportTickets.target}
          />
          <KpiCard
            label="Churn Rate"
            value={`${churnRate.current}%`}
            subLabel="lower is better"
            mom={chMoM.pct} yoy={chYoY.pct}
            invertGood
            icon={<UserX size={18} />} accent={C.churn}
            target={`${churnRate.target}%`} targetMet={churnRate.current <= churnRate.target}
          />
          <KpiCard
            label="Severity Score"
            value={severityScore.current.toFixed(1)}
            subLabel="composite index"
            mom={svMoM.pct} yoy={svYoY.pct}
            invertGood
            icon={<Activity size={18} />} accent={C.severity}
          />
        </div>
      </div>

      {/* ── CSAT & NPS Trend ────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="CSAT & NPS Monthly Trend"
          subtitle="Customer satisfaction and net promoter score — 33 months"
          icon={<Star size={16} />}
        />
        <div className="bg-bg-surface border border-bg-border rounded-card p-5 shadow-sm">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={filteredMonthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={shortMonth} interval={2} />
              <YAxis yAxisId="csat" domain={[3.6, 4.1]} tick={{ fill: '#64748b', fontSize: 10 }} width={40}
                label={{ value: 'CSAT', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, dx: -4 }} />
              <YAxis yAxisId="nps" orientation="right" domain={[50, 70]} tick={{ fill: '#64748b', fontSize: 10 }} width={36}
                label={{ value: 'NPS', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 10, dx: 4 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine yAxisId="csat" y={3.8} stroke="#4f46e5" strokeDasharray="4 3" strokeOpacity={0.4} />
              <Area yAxisId="csat" type="monotone" dataKey="csat" name="CSAT" stroke={C.csat} fill={`${C.csat}20`} strokeWidth={2} dot={false} />
              <Line yAxisId="nps" type="monotone" dataKey="nps" name="NPS" stroke={C.nps} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Response Time & Support Tickets ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Response Time */}
        <div>
          <SectionHeader title="Avg Response Time" subtitle="Minutes — 50 min alert threshold" icon={<Clock size={16} />} />
          <div className="bg-bg-surface border border-bg-border rounded-card p-5 shadow-sm">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={filteredMonthly} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={shortMonth} interval={3} />
                <YAxis domain={[30, 75]} tick={{ fill: '#64748b', fontSize: 10 }} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={50} stroke="#dc2626" strokeDasharray="4 3" label={{ value: '50 min threshold', fill: '#dc2626', fontSize: 9, position: 'insideTopRight' }} />
                <Area type="monotone" dataKey="responseTime" name="Response Time (min)" stroke={C.response} fill={`${C.response}20`} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Support Tickets */}
        <div>
          <SectionHeader title="Monthly Support Tickets" subtitle="Volume by month — 800+ alert threshold" icon={<Ticket size={16} />} />
          <div className="bg-bg-surface border border-bg-border rounded-card p-5 shadow-sm">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filteredMonthly} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={shortMonth} interval={3} />
                <YAxis domain={[0, 1100]} tick={{ fill: '#64748b', fontSize: 10 }} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={800} stroke="#dc2626" strokeDasharray="4 3" label={{ value: '800 alert', fill: '#dc2626', fontSize: 9, position: 'insideTopRight' }} />
                <Bar dataKey="supportTickets" name="Support Tickets" radius={[3, 3, 0, 0]}>
                  {filteredMonthly.map((entry, i) => (
                    <Cell key={i} fill={ticketBarColor(entry.supportTickets)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Churn Rate & Severity Score ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Churn Rate */}
        <div>
          <SectionHeader title="Monthly Churn Rate" subtitle="% — below 3% healthy, 5%+ critical" icon={<UserX size={16} />} />
          <div className="bg-bg-surface border border-bg-border rounded-card p-5 shadow-sm">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filteredMonthly} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={shortMonth} interval={3} />
                <YAxis domain={[0, 0.10]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#64748b', fontSize: 10 }} width={40} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-bg-surface border border-bg-border rounded-lg p-3 text-xs shadow-md">
                        <p className="font-bold text-text-primary mb-2">{label}</p>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-red-600 font-medium">Churn Rate</span>
                          <span className="font-bold text-text-primary">{((payload[0].value as number) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0.05} stroke="#dc2626" strokeDasharray="4 3" label={{ value: '5% critical', fill: '#dc2626', fontSize: 9, position: 'insideTopRight' }} />
                <ReferenceLine y={0.03} stroke="#d97706" strokeDasharray="4 3" label={{ value: '3% warning', fill: '#d97706', fontSize: 9, position: 'insideTopLeft' }} />
                <Bar dataKey="churnRate" name="Churn Rate" radius={[3, 3, 0, 0]}>
                  {filteredMonthly.map((entry, i) => (
                    <Cell key={i} fill={churnBarColor(entry.churnRate * 100)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Prophet Forecast ────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Prophet Forecast"
          subtitle="6-month forward forecast with 95% confidence interval"
          icon={<TrendingUp size={16} />}
        />
        <div className="bg-bg-surface border border-bg-border rounded-card p-5 shadow-sm">
          {/* Toggle */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {(['csat', 'nps', 'response'] as ForecastKey[]).map(k => (
              <button
                key={k}
                onClick={() => setForecastKey(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  forecastKey === k
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-bg-base border-bg-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {k === 'csat' ? 'CSAT Score' : k === 'nps' ? 'NPS Score' : 'Response Time'}
              </button>
            ))}
            <span className="ml-auto text-xs text-text-muted">Shaded = 95% confidence interval &bull; Dashed = forecast</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={forecastData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={shortMonth} interval={1} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={45}
                domain={[
                  forecastKey === 'csat' ? 3.6 : forecastKey === 'nps' ? 50 : 30,
                  forecastKey === 'csat' ? 4.1 : forecastKey === 'nps' ? 70 : 68,
                ]} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {/* confidence band */}
              <Area type="monotone" dataKey="upper" name="Upper 95%" stroke="none" fill={`${forecastColor}20`} />
              <Area type="monotone" dataKey="lower" name="Lower 95%" stroke="none" fill="#ffffff" />
              {/* forecast line */}
              <Line type="monotone" dataKey="forecast" name={`Forecast ${forecastLabel}`} stroke={forecastColor} strokeWidth={2} strokeDasharray="5 3" dot={false} />
              {/* actual */}
              <Line type="monotone" dataKey="actual" name={`Actual ${forecastLabel}`} stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: '#059669' }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── AI Recommendations Grid ──────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="AI Recommendations & Strategic Insights"
          subtitle="Automated analysis driven by anomaly and forecast signals"
          icon={<Zap size={16} />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_RECOMMENDATIONS.map((rec, idx) => (
            <RecommendationCard key={idx} rec={rec} />
          ))}
        </div>
      </div>

      {/* ── Anomaly Table ────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Customer Experience Anomaly Events"
          subtitle={`${CX_ANOMALY_EVENTS.length} detected events — click a row to expand`}
          icon={<ShieldAlert size={16} />}
        />
        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {(['all', 'critical', 'warning', 'low'] as SevFilter[]).map(f => {
            const counts = { all: CX_ANOMALY_EVENTS.length, critical: CX_ANOMALY_EVENTS.filter(e => e.severity === 'critical').length, warning: CX_ANOMALY_EVENTS.filter(e => e.severity === 'warning').length, low: CX_ANOMALY_EVENTS.filter(e => e.severity === 'low').length };
            return (
              <button
                key={f}
                onClick={() => setSevFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  sevFilter === f
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-bg-surface border-bg-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {f} ({counts[f]})
              </button>
            );
          })}
          <button
            onClick={() => setExpandAll(o => !o)}
            className="ml-auto text-xs font-medium text-text-secondary hover:text-text-primary border border-bg-border rounded-lg px-3 py-1 bg-bg-surface shadow-xs"
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Anomaly list */}
        <div className="space-y-2">
          {filteredAnomalies.map(ev => (
            <AnomalyRow key={ev.id} ev={ev} />
          ))}
        </div>
      </div>
    </div>
  );
}