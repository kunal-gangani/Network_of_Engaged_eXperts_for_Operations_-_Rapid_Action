'use client'

import Link from 'next/link'
import { CategoryBadge } from '@/components/issues/IssueBadges'
import ExplainableDecay from './ExplainableDecay'

interface Props {
  id: string
  title: string
  category: string
  score: number
  timeAgo: string
}

export default function DecayCard({ id, title, category, score, timeAgo }: Props) {
  const color = score >= 80 ? '#E74C3C' : score >= 60 ? '#F5A623' : '#2ECC71'
  const deg   = Math.round(score * 3.6)

  return (
    <div className="relative p-5 flex items-start gap-4 group hover:bg-[#1C1C1C] transition-colors">
      {/* Make the gauge + title area a link, but not the expandable panel */}
      <Link href={`/issues/${id}`} className="absolute inset-0 z-0 no-underline" aria-label={title} />

      {/* Conic gauge */}
      <div className="relative z-10 shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: `conic-gradient(${color} ${deg}deg, #2E2E2E 0deg)` }}>
        <div className="w-10 h-10 rounded-full bg-[#141414] flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{score}</span>
        </div>
      </div>

      <div className="relative z-10 min-w-0 flex-1">
        <p className="text-xs font-medium text-white mb-1 line-clamp-2 group-hover:text-[#E8621A] transition-colors">
          {title}
        </p>
        <CategoryBadge category={category as any} />
        <p className="text-[10px] text-[#555] mt-1">{timeAgo}</p>
        {/* ExplainableDecay is interactive — sits above the link overlay via z-10 */}
        <div className="mt-2 relative z-10">
          <ExplainableDecay score={score} issueTitle={title} />
        </div>
      </div>
    </div>
  )
}
