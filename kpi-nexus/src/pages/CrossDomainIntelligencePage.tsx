import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Network,
  Zap,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Target,
  ShieldAlert,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import {
  CROSS_DOMAIN_FINDINGS,
  TOP_RISKS,
  type CrossDomainFinding,
  type TopRisk,
} from '../data/anomalyData';
import type { DomainType } from '../types/kpi';

// ── Palette ──────────────────────────────────────────────────

const DOMAIN_COLORS: Record<DomainType | string, string> = {
  Financial:            '#4f46e5',
  Workforce:            '#0891b2',
  'Customer Experience':'#d97706',
  Project:              '#059669',
};

const RISK_COLORS: Record<string, string> = {
  'Revenue Risk':     '#4f46e5',
  'Operational Risk': '#d97706',
  'People Risk':      '#0891b2',
  'Delivery Risk':    '#059669',
};

const URGENCY_STYLE: Record<string, string> = {
  Critical: 'bg-red-50/80 border-red-200 text-red-700',
  High:     'bg-amber-50/80 border-amber-200 text-amber-800',
  Medium:   'bg-indigo-50/80 border-indigo-200 text-indigo-800',
};

// ── Custom correlation tooltip ───────────────────────────────

const CorrelationTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: CrossDomainFinding = payload[0]?.payload?._full;
  if (!d) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xl max-w-xs">
      <p className="text-slate-900 text-xs font-semibold mb-1">
        {d.driverKpi.replace(/_/g, ' ')}
        <span className="text-slate-400 mx-1">→</span>
        {d.targetKpi.replace(/_/g, ' ')}
      </p>
      <div className="flex gap-3 text-xs mb-2">
        <span style={{ color: d.correlation >= 0 ? '#059669' : '#dc2626' }} className="font-bold text-sm">
          r = {d.correlation.toFixed(2)}
        </span>
        <span className="text-slate-500">p = {d.pValue.toFixed(4)}</span>
        <span className="text-slate-500">{d.monthsOfData}mo</span>
      </div>
      <p className="text-slate-600 text-xs leading-relaxed">{d.plainEnglish}</p>
    </div>
  );
};

// ── Finding card ─────────────────────────────────────────────

function FindingCard({ finding, rank }: { finding: CrossDomainFinding; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const isPos = finding.causalDirection === 'positive';

  return (
    <div className="bg-[#f8fafc] border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 flex flex-col gap-4 shadow-sm transition-all hover:shadow-md">
      {/* header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-600">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold"
              style={{ background: DOMAIN_COLORS[finding.driverDomain] + '15', color: DOMAIN_COLORS[finding.driverDomain] }}
            >
              {finding.driverDomain}
            </span>
            <ArrowRight size={12} className="text-slate-400 self-center" />
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold"
              style={{ background: DOMAIN_COLORS[finding.targetDomain] + '15', color: DOMAIN_COLORS[finding.targetDomain] }}
            >
              {finding.targetDomain}
            </span>
          </div>
          <p className="text-slate-900 text-sm font-semibold leading-snug">
            {finding.driverKpi.replace(/_/g, ' ')}
            <span className="text-slate-400 mx-1.5">→</span>
            {finding.targetKpi.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {/* correlation badges */}
      <div className="flex flex-wrap gap-2">
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${
          isPos
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          r = {finding.correlation.toFixed(2)}
        </div>
        <div className="px-2.5 py-1 rounded-lg border border-slate-200/80 bg-white text-slate-600 text-xs font-medium">
          p = {finding.pValue.toFixed(4)}
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
          finding.strengthLabel === 'Strong'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : finding.strengthLabel === 'Moderate'
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
          {finding.strengthLabel}
        </div>
        <div
          className="px-2.5 py-1 rounded-lg text-xs font-bold border"
          style={{
            background: RISK_COLORS[finding.riskCategory] + '12',
            borderColor: RISK_COLORS[finding.riskCategory] + '30',
            color: RISK_COLORS[finding.riskCategory],
          }}
        >
          {finding.riskCategory}
        </div>
      </div>

      {/* plain English */}
      <p className="text-slate-600 text-xs leading-relaxed font-normal">{finding.plainEnglish}</p>

      {/* expand toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold text-left transition-colors"
      >
        {expanded ? '▲ Hide details' : '▼ Business explanation & action'}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-slate-200/80 pt-3">
          {/* Business explanation */}
          <div className="flex gap-2.5">
            <BookOpen size={14} className="text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-indigo-700 text-[10px] font-bold uppercase tracking-wide mb-1">Business Explanation</p>
              <p className="text-slate-600 text-xs leading-relaxed">{finding.businessExplanation}</p>
            </div>
          </div>
          {/* Executive action */}
          <div className="flex gap-2.5">
            <Target size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-700 text-[10px] font-bold uppercase tracking-wide mb-1">Recommended Executive Action</p>
              <p className="text-slate-600 text-xs leading-relaxed">{finding.executiveAction}</p>
            </div>
          </div>
          {/* Alert if present */}
          {finding.alertText && (
            <div className="flex gap-2.5 bg-amber-50/80 border border-amber-200 rounded-xl p-3">
              <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-900 text-xs leading-relaxed font-medium">{finding.alertText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Risk card ────────────────────────────────────────────────

function RiskCard({ risk }: { risk: TopRisk }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 shadow-sm ${URGENCY_STYLE[risk.urgency]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-black text-slate-300">#{risk.rank}</span>
          <div>
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
              risk.urgency === 'Critical' ? 'text-red-700' :
              risk.urgency === 'High'     ? 'text-amber-800' : 'text-indigo-700'
            }`}>
              {risk.urgency}
            </div>
            <h4 className="text-slate-900 font-bold text-sm leading-snug">{risk.title}</h4>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {risk.domains.map((d) => (
          <span
            key={d}
            className="px-2 py-0.5 rounded-md text-[10px] font-bold"
            style={{ background: DOMAIN_COLORS[d] + '18', color: DOMAIN_COLORS[d] }}
          >
            {d}
          </span>
        ))}
      </div>

      <p className="text-slate-700 text-xs leading-relaxed font-normal">{risk.description}</p>

      <div className="border-t border-slate-200/60 pt-2.5 bg-white/50 rounded-xl p-2.5 mt-auto">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Key signal</p>
        <p className="text-slate-900 text-xs mt-0.5 font-semibold">{risk.linkedCorrelation}</p>
      </div>
    </div>
  );
}

// ── Filters ──────────────────────────────────────────────────

const DOMAIN_FILTERS: (DomainType | 'All')[] = [
  'All', 'Financial', 'Workforce', 'Customer Experience', 'Project',
];

const STRENGTH_FILTERS = ['All', 'Strong', 'Moderate', 'Weak'] as const;

// ── Main page ────────────────────────────────────────────────

const CrossDomainIntelligencePage: React.FC = () => {
  const [domainFilter, setDomainFilter] = useState<DomainType | 'All'>('All');
  const [strengthFilter, setStrengthFilter] = useState<'All' | 'Strong' | 'Moderate' | 'Weak'>('All');

  const filteredFindings = useMemo(() => {
    return CROSS_DOMAIN_FINDINGS.filter((f) => {
      const domOk = domainFilter === 'All' || f.driverDomain === domainFilter || f.targetDomain === domainFilter;
      const strOk = strengthFilter === 'All' || f.strengthLabel === strengthFilter;
      return domOk && strOk;
    });
  }, [domainFilter, strengthFilter]);

  // Chart data: sorted by |correlation|
  const chartData = useMemo(() => {
    return CROSS_DOMAIN_FINDINGS
      .slice()
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .map((f, i) => ({
        label: `${f.driverKpi.split('_').slice(-2).join(' ')} → ${f.targetKpi.split('_').slice(-2).join(' ')}`,
        shortLabel: `${i + 1}`,
        correlation: f.correlation,
        _full: f,
      }));
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-900 p-6 space-y-8">
      {/* ── Page header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Network size={24} className="text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Cross-Domain Intelligence</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Granger causality findings and strongest correlations across all business domains
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-[#f8fafc] border border-slate-200/80 shadow-xs rounded-xl px-4 py-2 text-slate-600 font-medium">
          <Zap size={14} className="text-indigo-600" />
          <span>{CROSS_DOMAIN_FINDINGS.length} causal relationships identified</span>
        </div>
      </div>

      {/* ── Summary stat row ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Findings', value: CROSS_DOMAIN_FINDINGS.length, sub: 'Causal relationships', icon: <Network size={18} className="text-indigo-600" /> },
          { label: 'Strong Correlations', value: CROSS_DOMAIN_FINDINGS.filter(f => f.strengthLabel === 'Strong').length, sub: '|r| ≥ 0.50', icon: <Zap size={18} className="text-emerald-600" /> },
          { label: 'Risk Categories', value: 4, sub: 'Revenue · Ops · People · Delivery', icon: <ShieldAlert size={18} className="text-amber-600" /> },
          { label: 'Domains Linked', value: 4, sub: 'All domains interconnected', icon: <Network size={18} className="text-cyan-600" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-5 flex flex-col justify-between gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{s.label}</span>
              <div className="p-2 rounded-xl bg-slate-100">{s.icon}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Correlation strength chart ────────────────────────── */}
      <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Correlation Strength Overview</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            All {CROSS_DOMAIN_FINDINGS.length} cross-domain correlations, sorted by |r|. Green = positive, red = negative.
          </p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 40, left: 220, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              domain={[-1, 1]}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: '#334155', fontSize: 10, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={215}
            />
            <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
            <Tooltip content={<CorrelationTooltip />} />
            <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.correlation >= 0 ? '#059669' : '#dc2626'}
                  fillOpacity={0.8 + 0.2 * (Math.abs(d.correlation) / 0.7)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top Risks ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <ShieldAlert size={20} className="text-red-600" />
          <h2 className="text-lg font-bold text-slate-900">Top Risks</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TOP_RISKS.map((r) => (
            <RiskCard key={r.id} risk={r} />
          ))}
        </div>
      </div>

      {/* ── Individual findings ───────────────────────────────── */}
      <div>
        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Filter size={14} />
            <span>Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DOMAIN_FILTERS.map((d) => (
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
            {STRENGTH_FILTERS.map((sv) => (
              <button
                key={sv}
                onClick={() => setStrengthFilter(sv)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  strengthFilter === sv
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {sv}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Causal Findings</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              Expand any card for business explanation and recommended executive action
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-[#f8fafc] border border-slate-200/80 px-3 py-1 rounded-full shadow-xs">
            {filteredFindings.length} of {CROSS_DOMAIN_FINDINGS.length} findings
          </span>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-medium bg-[#f8fafc] border border-slate-200/80 rounded-2xl">
            No findings match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredFindings.map((f, i) => (
              <FindingCard key={f.id} finding={f} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrossDomainIntelligencePage;