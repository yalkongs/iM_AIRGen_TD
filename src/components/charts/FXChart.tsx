import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { HistoryPoint } from '../../types'

interface Props {
  data: HistoryPoint[]
  compact?: boolean
  color?: string
  label?: string
}

export default function FXChart({ data, compact, color = '#1e3a6e', label = 'USD/KRW' }: Props) {
  const h = compact ? 150 : 240
  const min = Math.min(...data.map(d => d.value))
  const max = Math.max(...data.map(d => d.value))
  const pad = (max - min) * 0.2

  return (
    <ResponsiveContainer width="100%" height={h}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="fxGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: compact ? 8 : 11 }} interval={compact ? 4 : 2} />
        <YAxis
          domain={[min - pad, max + pad]}
          tick={{ fontSize: compact ? 9 : 11 }}
          tickFormatter={v => v.toFixed(compact ? 0 : 1)}
        />
        {!compact && <Tooltip formatter={(v: number) => `${v.toFixed(2)}원`} />}
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#fxGrad)"
          name={label}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
