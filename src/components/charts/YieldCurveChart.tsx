import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { YieldCurvePoint } from '../../types'

interface Props {
  data: YieldCurvePoint[]
  compact?: boolean
}

export default function YieldCurveChart({ data, compact }: Props) {
  const h = compact ? 150 : 240
  return (
    <ResponsiveContainer width="100%" height={h}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="tenor" tick={{ fontSize: compact ? 9 : 11 }} />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: compact ? 9 : 11 }}
          tickFormatter={v => `${v.toFixed(2)}%`}
        />
        {!compact && <Tooltip formatter={(v: number) => `${v.toFixed(3)}%`} />}
        {!compact && (
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(v) => v === 'today' ? '오늘' : v === 'weekAgo' ? '1주 전' : '1개월 전'}
          />
        )}
        <Line type="monotone" dataKey="today"    stroke="#0d1b3e" strokeWidth={2}  dot={false} name="today" />
        <Line type="monotone" dataKey="weekAgo"  stroke="#c9a227" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="weekAgo" />
        <Line type="monotone" dataKey="monthAgo" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="2 2" dot={false} name="monthAgo" />
      </LineChart>
    </ResponsiveContainer>
  )
}
