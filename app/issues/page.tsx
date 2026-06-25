import { createClient } from '@/lib/supabase/server'
import IssueCard from '@/components/IssueCard'
import { Issue } from '@/types'
import Link from 'next/link'
import { Plus, MapPin } from 'lucide-react'

export const revalidate = 0

export default async function IssuesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('issues')
    .select('*, vote_count:votes(count)')
    .order('created_at', { ascending: false })

  const issues: Issue[] = (data ?? []).map((issue: any) => ({
    ...issue,
    vote_count: issue.vote_count?.[0]?.count ?? 0,
  }))

  const stats = {
    total: issues.length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    verified: issues.filter(i => i.status === 'verified').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Community issues</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.total} reported · {stats.verified} verified · {stats.resolved} resolved
          </p>
        </div>
        <Link
          href="/report"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Report issue
        </Link>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-500">No issues reported yet</p>
          <p className="text-sm mt-1">Be the first to report a civic issue in your area</p>
          <Link href="/report" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Report the first issue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}
