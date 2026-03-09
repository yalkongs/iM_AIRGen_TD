import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import type { HistoryPoint } from '../../types'

interface Props {
  data: HistoryPoint[]
  compact?: boolean
}

export default function SpreadChart({ data, compact }: Props) {
  const h = compact ? 150 : 240
  const avg = data.reduce((s, d) => s + d.value, 0) / data.length

  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: compact ? 8 : 11 }} interval={compact ? 4 : 2} />
        <YAxis tick={{ fontSize: compact ? 9 : 11 }} tickFormatter={v => `${v}bp`} />
        {!compact && <Tooltip formatter={(v: number) => `${v.toFixed(0)}bp`} />}
        <ReferenceLine y={avg} stroke="#c9a227" strokeDasharray="4 2" />
        <Bar dataKey="value" name="AA- 스프레드" radius={[2,2,0,0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value > avg ? '#dc2626' : '#1e3a6e'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
