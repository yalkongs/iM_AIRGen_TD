import RateHistoryChart from '../charts/RateHistoryChart'
import FXChart from '../charts/FXChart'
import SpreadChart from '../charts/SpreadChart'
import YieldCurveChart from '../charts/YieldCurveChart'
import { getActiveSnapshot, getActiveHistory, buildYieldCurveFromData } from '../../utils/marketStore'
import type { ReportSection } from '../../types'

const s = getActiveSnapshot()
const history = getActiveHistory()
const yieldCurve = buildYieldCurveFromData(s, history)
const fmt = (v: number, d = 2) => v.toFixed(d)

interface Props {
  sections: ReportSection[]
  date: string
  classification: string
  author: string
  narrative: string
  narrativeLoading?: boolean
}

export default function MonthlyContent({ sections, date, classification, author, narrative, narrativeLoading }: Props) {
  const enabled = (id: string) => sections.find(s => s.id === id)?.enabled !== false

  return (
    <>
      {/* 커버 헤더 */}
      <div style={{ background: '#0d1b3e', margin: '-60px -72px 0', padding: '40px 72px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: '7pt', color: '#94a3b8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
          iMBank Trading Desk — Monthly Market Report
        </div>
        <div style={{ fontSize: '22pt', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
          월간 마켓리포트
        </div>
        <div style={{ fontSize: '12pt', color: '#c9a227', marginTop: 6, fontWeight: 500 }}>
          2026년 2월호
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
          {[
            ['기준금리', `${fmt(s.rates.baseRate)}%`, '동결'],
            ['국고 10Y', `${fmt(s.rates.ktb10y.value)}%`, '月 +18bp'],
            ['USD/KRW', `${fmt(s.fx.usdKrw.value, 0)}원`, '月 +20원'],
            ['KOSPI', s.overseas.kospi.value.toLocaleString(), '月 +1.5%'],
          ].map(([label, val, chg]) => (
            <div key={label} style={{ color: 'white' }}>
              <div style={{ fontSize: '7pt', color: '#94a3b8', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: '12pt', fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: '8pt', color: '#c9a227' }}>{chg}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 월간 총평 */}
      {enabled('summary') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 이달의 마켓 총평 & 차월 전망</h2>
          <div style={{
            background: narrativeLoading ? '#f1f5f9' : '#f8fafc',
            borderLeft: '3px solid #c9a227', padding: '10px 14px',
            fontSize: '9pt', lineHeight: 1.8, whiteSpace: 'pre-line',
            color: narrativeLoading ? '#94a3b8' : '#1e293b', minHeight: 80,
          }}>
            {narrativeLoading ? 'AI 총평 생성 중...' : narrative || '좌측 패널에서 [AI 총평 생성] 버튼을 눌러주세요.'}
          </div>
        </div>
      )}

      {/* 차트 세트 */}
      {(enabled('rateChart') || enabled('yieldCurve')) && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 금리 동향</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ 국고채 금리 추이 (20영업일)</h3>
              <RateHistoryChart ktb3y={history.ktb3y} ktb10y={history.ktb10y} compact />
            </div>
            <div>
              <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ 수익률곡선 (월중 변화)</h3>
              <YieldCurveChart data={yieldCurve} compact />
            </div>
          </div>
        </div>
      )}

      {enabled('fxChart') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 외환시장</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ USD/KRW 추이</h3>
              <FXChart data={history.usdKrw} compact color="#1e3a6e" />
            </div>
            <div>
              <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ 미 국채 10Y 추이</h3>
              <FXChart data={history.ust10y} compact color="#dc2626" />
            </div>
          </div>
        </div>
      )}

      {enabled('spreadChart') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 크레딧 시장</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ 회사채 AA- 스프레드 (bp)</h3>
              <SpreadChart data={history.corpSpread} compact />
            </div>
            <div>
              <table style={{ marginTop: 20 }}>
                <thead><tr><th style={{ textAlign: 'left' }}>종목</th><th>현재</th><th>전월말</th><th>月변동</th></tr></thead>
                <tbody>
                  {[
                    ['은행채 AAA 3Y', `${fmt(s.rates.bankBond3y.value)}%`, '3.40%', '+5bp'],
                    ['회사채 AA- 3Y', `${fmt(s.rates.corpAAMinus3y.value)}%`, '3.78%', '+10bp'],
                    ['회사채 BBB-3Y', `${fmt(s.rates.corpBBBMinus3y.value)}%`, '5.75%', '+17bp'],
                    ['IRS 3Y',       `${fmt(s.rates.irs3y.value)}%`, '3.32%', '+10bp'],
                    ['KRW CDS 5Y',   `${fmt(s.overseas.koreaCds5y.value)}bp`, '47.2bp', '+1.3bp'],
                  ].map(([n, c, p, ch], i) => (
                    <tr key={i}><td>{n}</td><td>{c}</td><td>{p}</td>
                      <td>{String(ch).startsWith('+') ? <span className="val-up">{ch}</span> : <span className="val-down">{ch}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 中央은行 동향 */}
      {enabled('overseas') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 중앙은행 정책 동향</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '9pt' }}>
            {[
              { name: '한국은행', rate: '3.00%', action: '동결', next: '3/26 금통위', color: '#1e3a6e' },
              { name: 'Fed', rate: '5.25~5.50%', action: '동결', next: '3/19 FOMC', color: '#dc2626' },
              { name: 'ECB', rate: '4.00%', action: '동결', next: '3/7 통화정책회의', color: '#d97706' },
            ].map(cb => (
              <div key={cb.name} style={{ border: `1px solid ${cb.color}`, borderRadius: 4, padding: '8px 10px' }}>
                <div style={{ fontWeight: 700, color: cb.color, marginBottom: 4 }}>{cb.name}</div>
                <div>기준금리: <b>{cb.rate}</b></div>
                <div>2월 결정: <b>{cb.action}</b></div>
                <div>차기 회의: {cb.next}</div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* 푸터 */}
      <div style={{
        position: 'absolute', bottom: 40, left: 72, right: 72,
        borderTop: '1px solid #e2e8f0', paddingTop: 8,
        display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: '#94a3b8',
      }}>
        <div><div>데이터 출처: ECOS(한국은행) · FRED(미 연준) · Yahoo Finance · 금융투자협회 | {date} 기준</div><div>본 자료는 내부 참고용이며 외부 배포를 금합니다.</div></div>
        <div style={{ textAlign: 'right' }}><div>작성: {author} | 자금시장부</div><div>배포: 이사회, 본부장, 부행장, 전체 자금시장 담당자</div></div>
      </div>
    </>
  )
}
