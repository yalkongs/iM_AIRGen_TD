import { useEffect, useRef, useState, forwardRef } from 'react'

interface Props {
  children: React.ReactNode
}

// A4 스케일 래퍼 — 모바일에서 자동 축소
export const A4ScaleWrapper = ({ children }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth
        setScale(w < 794 ? w / 794 : 1)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div ref={containerRef} className="w-full overflow-x-hidden">
      <div style={{ width: 794 * scale, minHeight: 1123 * scale }}>
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: 794,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// 인쇄용 A4 페이지 — forwardRef로 react-to-print 없이 window.print() 지원
export const A4Page = forwardRef<HTMLDivElement, Props>(({ children }, ref) => {
  return (
    <div ref={ref} className="a4-page print-root">
      {children}
    </div>
  )
})
A4Page.displayName = 'A4Page'
