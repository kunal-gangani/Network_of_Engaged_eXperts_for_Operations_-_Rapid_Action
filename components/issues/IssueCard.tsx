import Link from 'next/link'
import Image from 'next/image'
import { Issue } from '@/types'
import { CategoryBadge, StatusBadge, SeverityDots } from './IssueBadges'
import { ThumbsUp, Clock } from 'lucide-react'
import { timeAgo } from '@/utils/date'

export default function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Link href={`/issues/${issue.id}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all">
        <div className="relative h-40 bg-gray-100">
          {issue.image_url ? (
            <Image src={issue.image_url} alt={issue.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No photo</div>
          )}
          <div className="absolute top-2 left-2">
            <CategoryBadge category={issue.category} />
          </div>
          <div className="absolute top-2 right-2">
            <StatusBadge status={issue.status} />
          </div>
        </div>

        <div className="p-3">
          <p className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">{issue.title}</p>
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
            {issue.ai_summary || issue.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ThumbsUp className="w-3.5 h-3.5" />
                {issue.vote_count ?? 0}
              </div>
              <SeverityDots severity={issue.severity} />
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {timeAgo(issue.created_at)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
