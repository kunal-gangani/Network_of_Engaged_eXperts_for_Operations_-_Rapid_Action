'use client'

const CATEGORIES = ['Pothole', 'Water', 'Light', 'Garbage', 'Animals', 'Other']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Mock heatmap data: 7 days × 6 categories — intensity 0–4
const DATA: number[][] = [
  [3, 1, 0, 2, 0, 1],
  [4, 2, 1, 3, 1, 0],
  [2, 3, 0, 1, 2, 1],
  [4, 1, 2, 4, 0, 2],
  [3, 4, 1, 2, 1, 0],
  [1, 2, 3, 1, 0, 1],
  [4, 3, 1, 3, 2, 1],
]

const INTENSITY: Record<number, string> = {
  0: 'bg-[#1C1C1C]',
  1: 'bg-[#E8621A33]',
  2: 'bg-[#E8621A66]',
  3: 'bg-[#E8621A99]',
  4: 'bg-[#E8621A]',
}

const LABELS: Record<number, string> = {
  0: 'None', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical',
}

export default function AISeverityHeatmap() {
  return (
    <div className="border-b border-[#2E2E2E]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2E2E2E]">
        <span className="text-[11px] font-medium text-white">AI Severity Heatmap</span>
        <span className="text-[9px] bg-[#E8621A22] text-[#E8621A] border border-[#E8621A44] px-2 py-0.5 rounded">✦ 7-day forecast</span>
      </div>

      <div className="p-5 overflow-x-auto">
        {/* Category labels */}
        <div className="flex gap-1 mb-1 ml-10">
          {CATEGORIES.map(c => (
            <div key={c} className="flex-1 text-center text-[9px] text-[#555] min-w-[36px]">{c}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-col gap-1">
          {DATA.map((row, di) => (
            <div key={di} className="flex items-center gap-1">
              <span className="text-[9px] text-[#555] w-9 shrink-0 text-right pr-1">{DAYS[di]}</span>
              {row.map((val, ci) => (
                <div
                  key={ci}
                  className={`flex-1 min-w-[36px] h-7 rounded-sm transition-colors ${INTENSITY[val]}`}
                  title={`${DAYS[di]} · ${CATEGORIES[ci]}: ${LABELS[val]}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <span className="text-[9px] text-[#555]">Intensity:</span>
          {Object.entries(LABELS).map(([k, label]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${INTENSITY[Number(k)]}`} />
              <span className="text-[9px] text-[#555]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
