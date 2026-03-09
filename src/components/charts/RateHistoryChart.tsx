import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { HistoryPoint } from '../../types'

interface Props {
  ktb3y: HistoryPoint[]
  ktb10y: HistoryPoint[]
  compact?: boolean
}

export default function RateHistoryChart({ ktb3y, ktb10y, compact }: Props) {
  const combined = ktb3y.map((pt, i) => ({
    date: pt.date,
    ktb3y: pt.value,
    ktb10y: ktb10y[i]?.value,
  }))
  const h = compact ? 150 : 240

  return (
    <ResponsiveContainer width="100%" height={h}>
      <LineChart data={combined} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: compact ? 8 : 11 }} interval={compact ? 4 : 2} />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: compact ? 9 : 11 }}
          tickFormatter={v => `${v.toFixed(2)}`}
        />
        {!compact && <Tooltip formatter={(v: number) => `${v.toFixed(3)}%`} />}
        {!compact && (
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(v) => v === 'ktb3y' ? '국고3Y' : '국고10Y'}
          />
        )}
        <Line type="monotone" dataKey="ktb3y"  stroke="#1e3a6e" strokeWidth={2}  dot={false} name="ktb3y" />
        <Line type="monotone" dataKey="ktb10y" stroke="#c9a227" strokeWidth={1.5} dot={false} name="ktb10y" />
      </LineChart>
    </ResponsiveContainer>
  )
}
