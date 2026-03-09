import RateHistoryChart from '../charts/RateHistoryChart'
import FXChart from '../charts/FXChart'
import SpreadChart from '../charts/SpreadChart'
import YieldCurveChart from '../charts/YieldCurveChart'
import { weekEvents } from '../../utils/mockData'
import { getActiveSnapshot, getActiveHistory, buildYieldCurveFromData } from '../../utils/marketStore'
import type { ReportSection } from '../../types'

const s = getActiveSnapshot()
const history = getActiveHistory()
const yieldCurve = buildYieldCurveFromData(s, history)
const fmt = (v: number, d = 2) => v.toFixed(d)
const bpChg = (v: number) =>
  v > 0 ? <span className="val-up">+{v}bp</span>
  : v < 0 ? <span className="val-down">{v}bp</span>
  : <span className="val-flat">-</span>

const COUNTRY_FLAG: Record<string, string> = { KR: '🇰🇷', US: '🇺🇸', EU: '🇪🇺', JP: '🇯🇵', CN: '🇨🇳' }

interface Props {
  sections: ReportSection[]
  date: string
  classification: string
  author: string
  narrative: string
  narrativeLoading?: boolean
}

export default function WeeklyContent({ sections, date, classification, author, narrative, narrativeLoading }: Props) {
  const enabled = (id: string) => sections.find(s => s.id === id)?.enabled !== false

  return (
    <>
      {/* 헤더 */}
      <div style={{ borderBottom: '2px solid #0d1b3e', paddingBottom: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '7pt', color: '#64748b', fontWeight: 500, letterSpacing: 2 }}>iMBank Trading Desk</div>
            <div style={{ fontSize: '16pt', fontWeight: 700, color: '#0d1b3e', lineHeight: 1.2 }}>주간 마켓리뷰</div>
            <div style={{ fontSize: '9pt', color: '#475569', marginTop: 2 }}>2026년 제10주 (3.2 ~ 3.6)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9pt', fontWeight: 600, color: '#0d1b3e' }}>{date.replace(/-/g, '.')} 기준</div>
            <div style={{
              display: 'inline-block', marginTop: 4,
              background: '#0d1b3e', color: 'white', fontSize: '7pt', fontWeight: 700,
              padding: '2px 8px', borderRadius: 2, letterSpacing: 1,
            }}>{classification}</div>
          </div>
        </div>
        <div style={{ height: 3, background: 'linear-gradient(to right, #0d1b3e, #c9a227)', marginTop: 8, borderRadius: 2 }} />
      </div>

      {/* 주간 총평 */}
      {enabled('summary') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 주간 마켓 총평</h2>
          <div style={{
            background: narrativeLoading ? '#f1f5f9' : '#f8fafc',
            borderLeft: '3px solid #c9a227', padding: '8px 12px',
            fontSize: '9pt', lineHeight: 1.7, whiteSpace: 'pre-line',
            color: narrativeLoading ? '#94a3b8' : '#1e293b', minHeight: 60,
          }}>
            {narrativeLoading ? 'AI 총평 생성 중...' : narrative || '좌측 패널에서 [AI 총평 생성] 버튼을 눌러주세요.'}
          </div>
        </div>
      )}

      {/* 주간 지표 변동 */}
      {enabled('rateTable') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 주간 주요 지표 변동</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4, color: '#475569', fontSize: '8pt' }}>▸ 금리 (주간 변동, bp)</h3>
              <table>
                <thead><tr><th style={{ textAlign: 'left' }}>종목</th><th>주초</th><th>주말</th><th>변동</th></tr></thead>
                <tbody>
                  {[
                    ['국고채 3Y',  '3.21', fmt(s.rates.ktb3y.value), s.rates.ktb3y.change * 2],
                    ['국고채 5Y',  '3.29', fmt(s.rates.ktb5y.value), s.rates.ktb5y.change * 2],
                    ['국고채 10Y', '3.46', fmt(s.rates.ktb10y.value), s.rates.ktb10y.change * 2],
                    ['CD 91일',   '3.45', fmt(s.rates.cd91.value), s.rates.cd91.change * 2],
                    ['IRS 3Y',    '3.38', fmt(s.rates.irs3y.value), s.rates.irs3y.change * 2],
                    ['회사채 AA-','3.84', fmt(s.rates.corpAAMinus3y.value), s.rates.corpAAMinus3y.change * 2],
                  ].map(([name, prev, cur, chg], i) => (
                    <tr key={i}><td>{name}</td><td>{prev}</td><td>{cur}</td><td>{bpChg(Number(chg))}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 style={{ marginBottom: 4, color: '#475569', fontSize: '8pt' }}>▸ 외환/자산 (주간 변동)</h3>
              <table>
                <thead><tr><th style={{ textAlign: 'left' }}>구분</th><th>주초</th><th>주말</th><th>변동</th></tr></thead>
                <tbody>
                  {[
                    ['USD/KRW', '1,314.0', fmt(s.fx.usdKrw.value, 1), '+6.5원'],
                    ['EUR/KRW', '1,438.5', fmt(s.fx.eurKrw.value, 1), '+11.7원'],
                    ['DXY',     '103.0',   fmt(s.fx.dxy.value, 2), '+0.52pt'],
                    ['미 10Y(%)', '4.60',  fmt(s.overseas.ust10y.value), '+8bp'],
                    ['KOSPI',   '2,562',   s.overseas.kospi.value.toLocaleString(), '+18.5p'],
                    ['VIX',     '19.3',    fmt(s.overseas.vix.value, 1), '-0.8'],
                  ].map(([name, prev, cur, chg], i) => (
                    <tr key={i}><td>{name}</td><td>{prev}</td><td>{cur}</td>
                      <td>{String(chg).startsWith('+') ? <span className="val-up">{chg}</span> : <span className="val-down">{chg}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 차트 */}
      {(enabled('rateChart') || enabled('fxChart')) && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 주간 차트</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {enabled('rateChart') && (
              <div>
                <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ 국고채 금리 추이</h3>
                <RateHistoryChart ktb3y={history.ktb3y.slice(-10)} ktb10y={history.ktb10y.slice(-10)} compact />
              </div>
            )}
            {enabled('fxChart') && (
              <div>
                <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ USD/KRW 추이</h3>
                <FXChart data={history.usdKrw.slice(-10)} compact color="#1e3a6e" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 크레딧 스프레드 */}
      {enabled('spreadChart') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 크레딧 스프레드 동향</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 4, fontSize: '8pt', color: '#475569' }}>▸ 회사채 AA- 스프레드 vs KTB3Y (bp)</h3>
              <SpreadChart data={history.corpSpread.slice(-10)} compact />
            </div>
            <div>
              <table style={{ marginTop: 20 }}>
                <thead><tr><th style={{ textAlign: 'left' }}>크레딧 구분</th><th>스프레드</th><th>전주대비</th></tr></thead>
                <tbody>
                  {[
                    ['은행채 AAA 3Y', '20bp', '+1bp'],
                    ['회사채 AA- 3Y', '63bp', '+3bp'],
                    ['회사채 A+ 3Y',  '95bp', '+2bp'],
                    ['회사채 BBB- 3Y','267bp', '+5bp'],
                    ['한국 CDS 5Y',   `${fmt(s.overseas.koreaCds5y.value, 1)}bp`, '-0.8bp'],
                  ].map(([name, sp, chg], i) => (
                    <tr key={i}><td>{name}</td><td>{sp}</td>
                      <td>{String(chg).startsWith('+') ? <span className="val-up">{chg}</span> : <span className="val-down">{chg}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 주요 일정 */}
      {enabled('calendar') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 차주 주요 일정</h2>
          <table>
            <thead>
              <tr><th style={{ textAlign: 'left', width: '10%' }}>일자</th><th style={{ textAlign: 'left', width: '8%' }}>국가</th><th style={{ textAlign: 'left' }}>이벤트</th><th>이전</th><th>예상</th></tr>
            </thead>
            <tbody>
              {weekEvents.filter(e => !e.actual).map((ev, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'left' }}>{ev.time}</td>
                  <td style={{ textAlign: 'left' }}>{COUNTRY_FLAG[ev.country]} {ev.country}</td>
                  <td style={{ textAlign: 'left' }}>{ev.event}</td>
                  <td>{ev.previous}</td><td>{ev.forecast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 수익률곡선 */}
      {enabled('yieldCurve') && (
        <div style={{ marginBottom: 14 }}>
          <h2>■ 수익률곡선 변화</h2>
          <YieldCurveChart data={yieldCurve} compact />
          <div style={{ fontSize: '7pt', color: '#94a3b8', textAlign: 'center', marginTop: 2 }}>
            ― 금주말 &nbsp;·· 전주말 &nbsp;-- 전전주말
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
        <div style={{ textAlign: 'right' }}><div>작성: {author} | 자금시장부</div><div>배포: 본부장, 부행장, 자금시장부 전체</div></div>
      </div>
    </>
  )
}
