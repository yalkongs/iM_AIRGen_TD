import type { MarketSnapshot } from '../types'

const fmt = (v: number, dec = 2) => v.toFixed(dec)
const bp  = (v: number) => v > 0 ? `+${v}bp` : v < 0 ? `${v}bp` : '보합'
const won = (v: number) => v > 0 ? `+${fmt(v, 0)}원` : v < 0 ? `${fmt(v, 0)}원` : '보합'
const pct = (v: number) => v > 0 ? `+${fmt(v, 1)}%` : v < 0 ? `${fmt(v, 1)}%` : '보합'

export function generateDailyNarrative(s: MarketSnapshot): string {
  const { rates, fx, overseas } = s

  const ustTone = overseas.ust10y.change > 2 ? '약세' : overseas.ust10y.change < -2 ? '강세' : '혼조세로'
  const domTone = rates.ktb3y.change > 0 ? '약세' : rates.ktb3y.change < 0 ? '강세' : '보합세로'
  const dxyTone = fx.dxy.change > 0 ? '강세' : '약세'
  const fxOutlook = fx.usdKrw.change < 0 ? '하락 압력' : '상승 압력'

  return `전일 미국 채권시장은 예상을 상회한 ISM 서비스업 PMI(실제 53.5, 컨센서스 52.8) 발표 영향으로 연준(Fed)의 금리인하 기대가 약화되며 ${ustTone} 마감하였습니다. 미 국채 10년물은 ${fmt(overseas.ust10y.value)}%로 전일 대비 ${bp(overseas.ust10y.change)} 변동하였으며, 2년물도 ${fmt(overseas.ust2y.value)}%로 ${bp(overseas.ust2y.change)} 상승하는 등 전 구간에서 금리가 올랐습니다. 달러화는 ${dxyTone}(DXY ${fmt(fx.dxy.value, 1)}, ${fx.dxy.change > 0 ? '+' : ''}${fmt(fx.dxy.change, 2)}pt)를 보이며 위험자산 선호 심리가 소폭 위축되었습니다.

금일 국내 채권시장은 전일 해외 금리 ${overseas.ust10y.change > 0 ? '상승' : '하락'} 영향으로 ${domTone} 출발이 예상됩니다. 국고 3년물은 ${fmt(rates.ktb3y.value)}%(${bp(rates.ktb3y.change)}), 10년물은 ${fmt(rates.ktb10y.value)}%(${bp(rates.ktb10y.change)})로 마감하였으며, 장단기 스프레드(10Y-3Y)는 ${fmt(rates.ktb10y.value - rates.ktb3y.value, 0)}bp 수준을 유지하고 있습니다. 오는 3월 26일 금통위를 앞두고 금리인하 기대가 부분적으로 선반영된 상황이나, 미국의 인플레이션 재점화 우려로 추가 매수세가 제한될 것으로 판단됩니다.

원달러 환율은 ${fmt(fx.usdKrw.value, 0)}원으로 전일 대비 ${won(fx.usdKrw.change)} 기록하였습니다. 달러화 ${dxyTone} 및 국내 수급 요인으로 금일 환율은 1,315~1,325원 레인지 내에서 ${fxOutlook}이 예상됩니다. 금일 오후 발표될 미국 비농업부문 고용(NFP, 컨센서스 19.0만 명)이 주요 변수로 작용할 전망입니다.`
}

export function generateWeeklySummary(s: MarketSnapshot): string {
  const { rates, fx, overseas } = s
  return `금주(3/3~3/6) 국내 채권시장은 미국 경제지표 호조에 따른 연준 금리인하 기대 약화로 전반적인 약세를 보였습니다. 국고 3년물은 주간 기준 ${bp(rates.ktb3y.change * 2)} 상승하였으며, 10년물은 ${bp(rates.ktb10y.change * 2)} 올랐습니다. 특히 한국은행이 지난 3월 5일 공개한 금통위 의사록에서 "물가 경로의 불확실성이 높다"는 표현이 확인되며 단기 금리하락 기대가 일부 후퇴하였습니다.

외환시장에서 원달러 환율은 주간 기준 약 ${fmt(Math.abs(fx.usdKrw.change * 2), 0)}원 ${fx.usdKrw.change < 0 ? '하락' : '상승'}한 ${fmt(fx.usdKrw.value, 0)}원으로 마감하였습니다. 미 국채 금리 상승과 달러 강세(DXY +${fmt(fx.dxy.change * 2, 2)}pt) 압력이 이어진 반면, 국내 경상수지 흑자 기대가 하방을 지지하는 모습이었습니다.

자금시장에서는 월말 법인세 납부 이후 단기 자금 수급이 안정을 되찾아 콜금리는 ${fmt(rates.call.value)}% 수준에서 안정적으로 유지되고 있습니다. CD 91일물은 ${fmt(rates.cd91.value)}%로 보합세를 이어가고 있으며, CP 91일물은 ${fmt(rates.cp91.value)}%로 소폭 상승하였습니다.`
}

export function generateMonthlySummary(s: MarketSnapshot): string {
  return `2026년 2월 국내 금융시장은 연준의 정책 불확실성과 국내 경기 하방 우려가 교차하며 변동성이 확대된 한 달이었습니다. 국고채 금리는 월중 기준 3년물이 12bp, 10년물이 18bp 상승하였으며, 이는 미국 소비자물가(CPI 3.0%) 상회 및 연준 의원들의 신중한 발언이 주요 요인으로 작용하였습니다.

한국은행은 2월 금통위(2/26)에서 기준금리를 3.00%로 동결하였으며, 총재는 기자간담회에서 "인플레이션이 목표 수렴 경로에 있으나 불확실성이 높다"고 언급하여 조기 금리인하 기대를 경계하였습니다. 금리 선물 시장에서는 연내 2회 인하(2H26)를 70%의 확률로 반영하고 있습니다.

원달러 환율은 월초 1,300원대 초반에서 월말 1,320원대로 약 20원 절하되었습니다. 트럼프 행정부의 관세 정책 불확실성과 수출 둔화 우려가 환율 상방 압력으로 작용하였습니다. 크레딧 시장에서는 은행채 AAA 3년물 스프레드가 20bp 내외로 안정적인 수준을 유지하였습니다.`
}
