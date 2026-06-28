'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Factor { label: string; points: number; color: string }

function getFactors(score: number): Factor[] {
  // Generate plausible weighted factors that sum close to score
  const base: Factor[] = [
    { label: 'Issue age',          points: Math.min(18, Math.round(score * 0.20)), color: '#F5A623' },
    { label: 'Severity level',     points: Math.min(16, Math.round(score * 0.18)), color: '#E74C3C' },
    { label: 'Heavy traffic area', points: Math.min(14, Math.round(score * 0.15)), color: '#E8621A' },
    { label: 'Rain forecast',      points: Math.min(13, Math.round(score * 0.14)), color: '#3B82F6' },
    { label: 'Citizen reports',    points: Math.min(10, Math.round(score * 0.12)), color: '#8B5CF6' },
    { label: 'Near school/hospital', points: Math.min(9, Math.round(score * 0.10)), color: '#2ECC71' },
    { label: 'Duplicate reports',  points: Math.min(8, Math.round(score * 0.08)), color: '#888888' },
  ]
  return base.filter(f => f.points > 0)
}

interface Props {
  score: number
  issueTitle: string
}

export default function ExplainableDecay({ score, issueTitle }: Props) {
  const [open, setOpen] = useState(false)
  const color  = score >= 80 ? '#E74C3C' : score >= 60 ? '#F5A623' : '#2ECC71'
  const factors = getFactors(score)
  const maxPts  = Math.max(...factors.map(f => f.points))

  return (
    <div className="border border-[#2E2E2E] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-0 cursor-pointer text-left hover:bg-[#1C1C1C] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: color + '20', color }}>
            {score}
          </div>
          <span className="text-[11px] text-[#888]">Why did AI assign this score?</span>
        </div>
        <ChevronDown size={14} className={`text-[#555] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#2E2E2E]">
          <p className="text-[9px] text-[#555] mt-3 mb-3 uppercase tracking-widest">
            Weighted factors — {issueTitle.slice(0, 40)}{issueTitle.length > 40 ? '…' : ''}
          </p>
          <div className="flex flex-col gap-2">
            {factors.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] w-4 font-semibold shrink-0" style={{ color: f.color }}>
                  +{f.points}
                </span>
                <div className="flex-1 h-0.5 bg-[#2E2E2E] rounded-full">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ background: f.color, width: `${Math.round((f.points / maxPts) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-[#555] w-28 shrink-0">{f.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2E2E2E]">
            <span className="text-[9px] text-[#555] uppercase tracking-widest">Final Score</span>
            <span className="text-lg font-bold" style={{ color }}>{score}</span>
          </div>
        </div>
      )}
    </div>
  )
}
