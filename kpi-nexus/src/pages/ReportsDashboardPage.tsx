import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from 'recharts';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Mail,
  Play,
  Pause,
  Eye,
  RefreshCw,
  Shield,
  Users,
  Heart,
  Briefcase,
  DollarSign,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  EXECUTIVE_SUMMARY,
  FINANCIAL_QUARTERLY,
  FINANCIAL_KPI_CARDS,
  FINANCIAL_INSIGHTS,
  WORKFORCE_QUARTERLY,
  WORKFORCE_KPI_CARDS,
  WORKFORCE_INSIGHTS,
  CX_QUARTERLY,
  CX_KPI_CARDS,
  CX_INSIGHTS,
  PROJECT_QUARTERLY,
  PROJECT_KPI_CARDS,
  PROJECT_INSIGHTS,
  RECENT_REPORTS,
  SCHEDULED_REPORTS,
  type ReportType,
  type ScheduledReport,
  type RecentReport,
} from '../data/reportData';

// ── constants ─────────────────────────────────────────────────────────────────

const TABS: { id: ReportType; label: string; icon: React.ReactNode }[] = [
  { id: 'executive', label: 'Executive Summary', icon: <Shield className="w-4 h-4" /> },
  { id: 'financial', label: 'Financial Report', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'workforce', label: 'Workforce Report', icon: <Users className="w-4 h-4" /> },
  { id: 'customer', label: 'Customer Experience', icon: <Heart className="w-4 h-4" /> },
  { id: 'project', label: 'Project Report', icon: <Briefcase className="w-4 h-4" /> },
];

const TYPE_COLORS: Record<ReportType, string> = {
  executive: '#4f46e5',
  financial: '#0891b2',
  workforce: '#059669',
  customer: '#7c3aed',
  project: '#d97706',
};

const TYPE_LABELS: Record<ReportType, string> = {
  executive: 'Executive',
  financial: 'Financial',
  workforce: 'Workforce',
  customer: 'Customer',
  project: 'Project',
};

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'one-time': 'One-time',
};

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const pct = (v: number) => `${v.toFixed(1)}%`;

const dirIcon = (dir: 'up' | 'down' | 'neutral') =>
  dir === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> :
  dir === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-red-600" /> :
  <Minus className="w-3.5 h-3.5 text-slate-400" />;

const dirClass = (dir: 'up' | 'down' | 'neutral') =>
  dir === 'up' ? 'text-emerald-600' :
  dir === 'down' ? 'text-red-600' : 'text-slate-500';

// ── sub-components ────────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">{children}</h3>
);

const KpiGrid = ({ cards }: { cards: typeof FINANCIAL_KPI_CARDS }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
    {cards.map((c, i) => (
      <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
        <p className="text-xs text-slate-500 font-medium mb-1">{c.label}</p>
        <p className="text-xl font-bold text-slate-900">{c.value}</p>
        <div className="flex items-center gap-1 mt-1">
          {dirIcon(c.changeDir)}
          <span className={`text-xs font-semibold ${dirClass(c.changeDir)}`}>{c.change}</span>
          <span className="text-xs text-slate-400 ml-1">{c.sub}</span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-slate-100">
          <div className="h-1 rounded-full" style={{ width: '60%', background: c.color }} />
        </div>
      </div>
    ))}
  </div>
);

const InsightsBox = ({ items }: { items: string[] }) => (
  <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 mb-6">
    <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">AI-Generated Insights</p>
    <ul className="space-y-2">
      {items.map((s, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-700">
          <span className="text-indigo-600 font-bold mt-0.5">•</span>
          <span>{s}</span>
        </li>
      ))}
    </ul>
  </div>
);

// ── Executive Summary Tab ─────────────────────────────────────────────────────

const ExecutiveTab = () => {
  const ex = EXECUTIVE_SUMMARY;

  const radarData = ex.domainScores.map(d => ({ subject: d.domain, score: d.score }));

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="flex flex-wrap gap-4 items-start justify-between bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
        <div>
          <p className="text-xs text-slate-500 font-medium">Report Period</p>
          <p className="text-slate-900 font-semibold">{ex.period}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Report Date</p>
          <p className="text-slate-900 font-semibold">{ex.reportDate}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Overall Health Score</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900">{ex.overallScore}</span>
            <span className="text-slate-400 text-sm">/100</span>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {ex.overallScore >= 80 ? 'Healthy' : ex.overallScore >= 60 ? 'Moderate' : 'At Risk'}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-48 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600"
              style={{ width: `${ex.overallScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiGrid cards={ex.kpis} />

      {/* Domain Scores + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <SectionTitle>Domain Health Scores</SectionTitle>
          <div className="space-y-4">
            {ex.domainScores.map((d) => (
              <div key={d.domain}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700">{d.domain}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{d.score}</span>
                    {d.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> :
                     d.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-red-600" /> :
                     <Minus className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${d.score}%`, background: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <SectionTitle>Performance Radar</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickCount={4} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.2}
                dot={{ r: 3, fill: '#4f46e5' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Highlights / Risks / Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Key Highlights', items: ex.highlights, cls: 'border-emerald-200 bg-emerald-50/50', dot: 'text-emerald-600' },
          { title: 'Risks', items: ex.risks, cls: 'border-red-200 bg-red-50/50', dot: 'text-red-600' },
          { title: 'Opportunities', items: ex.opportunities, cls: 'border-indigo-200 bg-indigo-50/50', dot: 'text-indigo-600' },
        ].map(({ title, items, cls, dot }) => (
          <div key={title} className={`rounded-2xl border p-4 shadow-xs ${cls}`}>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">{title}</p>
            <ul className="space-y-2">
              {items.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-700 font-medium">
                  <span className={`${dot} font-bold mt-0.5 shrink-0`}>•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Financial Report Tab ──────────────────────────────────────────────────────

const FinancialTab = () => {
  const [expanded, setExpanded] = useState(false);

  const barData = FINANCIAL_QUARTERLY.map(r => ({
    period: r.period,
    Revenue: Math.round(r.revenue / 1000),
    'Cash Flow': Math.round(r.cashFlow / 1000),
    'Net Income': Math.round(r.netIncome / 1000),
  }));

  const marginData = FINANCIAL_QUARTERLY.map(r => ({
    period: r.period,
    'Profit Margin %': +(r.profitMargin * 100).toFixed(1),
    'D/E Ratio': +r.debtToEquity.toFixed(2),
  }));

  return (
    <div className="space-y-6">
      <KpiGrid cards={FINANCIAL_KPI_CARDS} />

      {/* Revenue / CF / NI Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <SectionTitle>Revenue, Cash Flow & Net Income — Quarterly ($K)</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v}K`} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
              itemStyle={{ color: '#475569' }}
              formatter={(v: number) => [`$${v}K`, '']}
            />
            <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
            <Bar dataKey="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cash Flow" fill="#0891b2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Net Income" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Margin + D/E Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <SectionTitle>Profit Margin & Debt-to-Equity Ratio — Quarterly</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={marginData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}×`} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
            <Line yAxisId="left" dataKey="Profit Margin %" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" dataKey="D/E Ratio" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <SectionTitle>Quarterly Data Table</SectionTitle>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
        {expanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  {['Period','Revenue','Cash Flow','Net Income','Expenditure','Profit Margin','D/E','Anomalies'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-right first:text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {FINANCIAL_QUARTERLY.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5 text-slate-900 font-semibold">{r.period}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">${(r.revenue/1000).toFixed(1)}K</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">${(r.cashFlow/1000).toFixed(1)}K</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">${(r.netIncome/1000).toFixed(1)}K</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">${(r.expenditure/1000).toFixed(1)}K</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{pct(r.profitMargin * 100)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.debtToEquity.toFixed(2)}×</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        r.anomalyCount > 3 ? 'bg-red-50 text-red-700 border border-red-200' :
                        r.anomalyCount > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>{r.anomalyCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InsightsBox items={FINANCIAL_INSIGHTS} />
    </div>
  );
};

// ── Workforce Report Tab ──────────────────────────────────────────────────────

const WorkforceTab = () => {
  const [expanded, setExpanded] = useState(false);

  const prodData = WORKFORCE_QUARTERLY.map(r => ({
    period: r.period,
    Productivity: +r.productivity.toFixed(1),
    Engagement: +r.engagement.toFixed(1),
    Attendance: +r.attendance.toFixed(1),
  }));

  const turnoverData = WORKFORCE_QUARTERLY.map(r => ({
    period: r.period,
    'Turnover %': +r.turnoverRate.toFixed(2),
    'Overtime hrs': +r.overtimeHours.toFixed(1),
    Anomalies: r.anomalyCount,
  }));

  return (
    <div className="space-y-6">
      <KpiGrid cards={WORKFORCE_KPI_CARDS} />

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <SectionTitle>Productivity, Engagement & Attendance — Quarterly (Score / %)</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={prodData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis domain={[60, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
            <Line dataKey="Productivity" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
            <Line dataKey="Engagement" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
            <Line dataKey="Attendance" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="2 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <SectionTitle>Turnover Rate & Overtime Hours — Quarterly</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={turnoverData} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="Turnover %" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="Overtime hrs" fill="#d97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <SectionTitle>Quarterly Data Table</SectionTitle>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
        {expanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  {['Period','Attendance %','Productivity','Engagement','Training h','Overtime h','Turnover %','Anomalies'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-right first:text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {WORKFORCE_QUARTERLY.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5 text-slate-900 font-semibold">{r.period}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.attendance.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.productivity.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.engagement.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.trainingHours.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.overtimeHours.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{pct(r.turnoverRate)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        r.anomalyCount > 15 ? 'bg-red-50 text-red-700 border border-red-200' :
                        r.anomalyCount > 8 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>{r.anomalyCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InsightsBox items={WORKFORCE_INSIGHTS} />
    </div>
  );
};

// ── Customer Experience Report Tab ────────────────────────────────────────────

const CustomerTab = () => {
  const [expanded, setExpanded] = useState(false);

  const satisfactionData = CX_QUARTERLY.map(r => ({
    period: r.period,
    'CSAT ×10': +(r.csat * 10).toFixed(2),
    NPS: +r.nps.toFixed(1),
  }));

  const ticketsData = CX_QUARTERLY.map(r => ({
    period: r.period,
    'Support Tickets': r.supportTickets,
    'Response Time (min)': +r.responseTime.toFixed(1),
    'Churn %': +(r.churnRate * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6">
      <KpiGrid cards={CX_KPI_CARDS} />

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <SectionTitle>CSAT & NPS Trends — Quarterly</SectionTitle>
        <p className="text-xs text-slate-500 mb-3 font-medium">CSAT shown ×10 to align scale with NPS</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={satisfactionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis domain={[30, 70]} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
            <Line dataKey="CSAT ×10" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line dataKey="NPS" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <SectionTitle>Support Volume & Churn — Quarterly</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ticketsData} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="Support Tickets" fill="#0891b2" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="Response Time (min)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="Churn %" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <SectionTitle>Quarterly Data Table</SectionTitle>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
        {expanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  {['Period','CSAT','NPS','Response Time','Support Tickets','Churn Rate','Anomalies'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-right first:text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CX_QUARTERLY.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5 text-slate-900 font-semibold">{r.period}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.csat.toFixed(3)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.nps.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.responseTime.toFixed(1)} min</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.supportTickets.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{pct(r.churnRate * 100)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        r.anomalyCount > 25 ? 'bg-red-50 text-red-700 border border-red-200' :
                        r.anomalyCount > 15 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>{r.anomalyCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InsightsBox items={CX_INSIGHTS} />
    </div>
  );
};

// ── Project Report Tab ────────────────────────────────────────────────────────

const ProjectTab = () => {
  const [expanded, setExpanded] = useState(false);

  const completionData = PROJECT_QUARTERLY.map(r => ({
    period: r.period,
    'Completion %': +r.completionRate.toFixed(1),
    'Budget Variance %': +r.budgetVariancePct.toFixed(1),
    'Delayed Task %': +(r.delayedTaskRate * 100).toFixed(1),
  }));

  const budgetData = PROJECT_QUARTERLY.map(r => ({
    period: r.period,
    'Budget Spent $K': Math.round(r.totalBudgetSpent / 1000),
    Anomalies: r.anomalyCount,
  }));

  return (
    <div className="space-y-6">
      <KpiGrid cards={PROJECT_KPI_CARDS} />

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <SectionTitle>Completion Rate, Budget Variance & Delay Rate — Quarterly (%)</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={completionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
              formatter={(v: number) => [`${v}%`, '']}
            />
            <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
            <Line dataKey="Completion %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line dataKey="Budget Variance %" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
            <Line dataKey="Delayed Task %" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="3 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <SectionTitle>Budget Spent & Anomalies — Quarterly</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={budgetData} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v}K`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ color: '#475569', fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="Budget Spent $K" radius={[4, 4, 0, 0]}>
              {budgetData.map((d, i) => (
                <Cell key={i} fill={d['Budget Spent $K'] > 2000 ? '#ef4444' : '#4f46e5'} />
              ))}
            </Bar>
            <Bar yAxisId="right" dataKey="Anomalies" fill="#d97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <SectionTitle>Quarterly Data Table</SectionTitle>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
        {expanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  {['Period','Completion %','Budget Variance %','Delayed Task %','Budget Spent','Anomalies'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-right first:text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PROJECT_QUARTERLY.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-2.5 text-slate-900 font-semibold">{r.period}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${r.completionRate < 80 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {r.completionRate.toFixed(1)}%
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${r.budgetVariancePct < 0 ? 'text-red-600' : 'text-amber-700'}`}>
                      {r.budgetVariancePct > 0 ? '+' : ''}{r.budgetVariancePct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{pct(r.delayedTaskRate * 100)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">${(r.totalBudgetSpent / 1000).toFixed(0)}K</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        r.anomalyCount >= 5 ? 'bg-red-50 text-red-700 border border-red-200' :
                        r.anomalyCount >= 2 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>{r.anomalyCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InsightsBox items={PROJECT_INSIGHTS} />
    </div>
  );
};

// ── Recent Reports Table ──────────────────────────────────────────────────────

const RecentReportsSection = () => {
  const [filter, setFilter] = useState<'all' | ReportType>('all');

  const filtered = filter === 'all'
    ? RECENT_REPORTS
    : RECENT_REPORTS.filter(r => r.type === filter);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle>Generated Reports Archive</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'executive', 'financial', 'workforce', 'customer', 'project'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === t
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left font-semibold">Report Name</th>
              <th className="px-4 py-2.5 text-left font-semibold">Type</th>
              <th className="px-4 py-2.5 text-left font-semibold">Generated At</th>
              <th className="px-4 py-2.5 text-right font-semibold">Size</th>
              <th className="px-4 py-2.5 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{r.title}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-bold"
                    style={{ background: TYPE_COLORS[r.type] + '15', color: TYPE_COLORS[r.type] }}
                  >
                    {TYPE_LABELS[r.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(r.generatedAt)}</td>
                <td className="px-4 py-3 text-right text-xs text-slate-500 font-medium">{r.fileSize}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 transition-colors" title="Download PDF">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('executive');

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-900 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Reports & Intelligence</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Cross-domain metrics, automated schedules, and executive export suite
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all">
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200/80 space-x-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 bg-white/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'executive' && <ExecutiveTab />}
      {activeTab === 'financial' && <FinancialTab />}
      {activeTab === 'workforce' && <WorkforceTab />}
      {activeTab === 'customer' && <CustomerTab />}
      {activeTab === 'project' && <ProjectTab />}

      {/* Archive Section */}
      <RecentReportsSection />
    </div>
  );
}