'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  type: 'category' | 'decay'
  data: Record<string, number>
}

const CAT_COLORS: Record<string, string> = {
  pothole:       '#E8621A',
  water_leakage: '#3B82F6',
  streetlight:   '#F5A623',
  garbage:       '#E74C3C',
  stray_animals: '#8B5CF6',
  other:         '#555555',
}

const CAT_LABELS: Record<string, string> = {
  pothole:       'Pothole',
  water_leakage: 'Water',
  streetlight:   'Light',
  garbage:       'Garbage',
  stray_animals: 'Animals',
  other:         'Other',
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#252525] border border-[#2E2E2E] rounded-md px-2.5 py-1.5 text-[11px] text-white">
      <p className="text-[9px] text-[#888] mb-0.5">{label}</p>
      <p className="font-semibold m-0">{payload[0].value} issues</p>
    </div>
  )
}

export default function DashboardCharts({ type, data }: Props) {
  if (type === 'category') {
    const chartData = Object.entries(data)
      .map(([key, value]) => ({ name: CAT_LABELS[key] ?? key, value, color: CAT_COLORS[key] ?? '#555' }))
      .sort((a, b) => b.value - a.value)

    if (chartData.length === 0) {
      return <div className="py-8 text-center text-[11px] text-[#555]">No data yet</div>
    }

    return (
      <div className="px-5 py-4">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#FFFFFF08' }} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === 'decay') {
    const chartData = [
      { name: 'Low (0–40)',     value: data.low    ?? 0, color: '#2ECC71' },
      { name: 'Medium (40–80)', value: data.medium ?? 0, color: '#F5A623' },
      { name: 'High (80+)',     value: data.high   ?? 0, color: '#E74C3C' },
    ]
    const total = chartData.reduce((s, d) => s + d.value, 0)

    return (
      <div className="px-5 py-4">
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={chartData} barSize={48} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#FFFFFF08' }} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="flex gap-4 mt-2 flex-wrap">
          {chartData.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-[9px] text-[#555]">
                {d.name.split(' ')[0]} — {total > 0 ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}
