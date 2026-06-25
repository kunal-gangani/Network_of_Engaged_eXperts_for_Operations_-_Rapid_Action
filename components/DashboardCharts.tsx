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

const DECAY_COLORS = ['#2ECC71', '#F5A623', '#E74C3C']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#252525', border: '1px solid #2E2E2E',
      borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#fff',
    }}>
      <p style={{ margin: 0, color: '#888', fontSize: '9px', marginBottom: '2px' }}>{label}</p>
      <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].value} issues</p>
    </div>
  )
}

export default function DashboardCharts({ type, data }: Props) {
  if (type === 'category') {
    const chartData = Object.entries(data)
      .map(([key, value]) => ({
        name: CAT_LABELS[key] ?? key,
        value,
        color: CAT_COLORS[key] ?? '#555',
      }))
      .sort((a, b) => b.value - a.value)

    if (chartData.length === 0) {
      return (
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: '11px', color: '#555' }}>
          No data yet
        </div>
      )
    }

    return (
      <div style={{ padding: '16px 20px 12px' }}>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: '#555' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#555' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FFFFFF08' }} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === 'decay') {
    const chartData = [
      { name: 'Low (0–40)',   value: data.low    ?? 0, color: '#2ECC71' },
      { name: 'Medium (40–80)', value: data.medium ?? 0, color: '#F5A623' },
      { name: 'High (80+)',   value: data.high   ?? 0, color: '#E74C3C' },
    ]

    const total = chartData.reduce((s, d) => s + d.value, 0)

    return (
      <div style={{ padding: '16px 20px 12px' }}>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={chartData} barSize={48} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: '#555' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#555' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FFFFFF08' }} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Percentage legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          {chartData.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: '9px', color: '#555' }}>
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
