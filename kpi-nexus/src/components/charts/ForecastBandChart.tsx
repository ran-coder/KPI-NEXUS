import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceDot,
} from 'recharts';
import { forecastRevenueData } from '../../data/chartData';

interface Props { height?: number }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const actual   = payload.find((p: any) => p.name === 'Actual');
  const forecast = payload.find((p: any) => p.name === 'Forecast');
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="text-slate-500 mb-2 font-medium">{label}</p>
      {actual && (
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
          <span className="text-slate-600">Actual:</span>
          <span className="text-slate-900 font-semibold">${(actual.value / 1000).toFixed(1)}K</span>
        </div>
      )}
      {forecast && (
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
          <span className="text-slate-600">Forecast:</span>
          <span className="text-slate-900 font-semibold">${(forecast.value / 1000).toFixed(1)}K</span>
        </div>
      )}
      {payload[0]?.payload?.isAnomaly && (
        <p className="text-red-600 font-medium mt-1 flex items-center gap-1">⚠ Trend anomaly</p>
      )}
    </div>
  );
};

// Find index where actual becomes null (forecast-only zone)
const FUTURE_START_IDX = forecastRevenueData.findIndex(d => d.actual === null);
const FUTURE_MONTH = FUTURE_START_IDX > 0 ? forecastRevenueData[FUTURE_START_IDX].month : '';

export default function ForecastBandChart({ height = 340 }: Props) {
  const anomalies = forecastRevenueData.filter(d => d.isAnomaly && d.actual !== null);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={forecastRevenueData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8B5CF6" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
        <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} width={52} domain={[55000, 100000]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          payload={[
            { value: 'Actual',          type: 'line', id: 'actual',   color: '#3B82F6' },
            { value: 'Forecast',        type: 'line', id: 'forecast', color: '#8B5CF6' },
            { value: 'Confidence Band', type: 'rect', id: 'band',     color: '#C4B5FD' },
            { value: 'Anomaly',         type: 'circle', id: 'anom',   color: '#EF4444' },
          ]}
          wrapperStyle={{ fontSize: 12, color: '#64748B', paddingTop: 8 }}
        />

        {/* Confidence band (area between upper and lower) */}
        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGrad)" dot={false} legendType="none" />
        <Area type="monotone" dataKey="lower" stroke="none" fill="#f0f4f9" dot={false} legendType="none" />

        {/* Forecast "future" region marker */}
        {FUTURE_MONTH && (
          <ReferenceLine x={FUTURE_MONTH} stroke="#CBD5E1" strokeDasharray="6 3"
            label={{ value: 'Forecast →', position: 'insideTopRight', fill: '#8B5CF6', fontSize: 10, fontWeight: 600 }} />
        )}

        <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#8B5CF6"
          strokeWidth={2} strokeDasharray="6 3" dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="actual" name="Actual" stroke="#3B82F6"
          strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#3B82F6', strokeWidth: 0 }} connectNulls={false} />

        {anomalies.map(d => (
          <ReferenceDot key={d.month} x={d.month} y={d.actual as number}
            r={6} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}