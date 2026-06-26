export type IssueCategory =
  | 'pothole'
  | 'water_leakage'
  | 'streetlight'
  | 'garbage'
  | 'stray_animals'
  | 'other'

export type IssueStatus =
  | 'reported'
  | 'verified'
  | 'in_progress'
  | 'resolved'

export interface Issue {
  id: string
  user_id: string
  title: string
  description: string
  category: IssueCategory
  severity: number
  decay_score: number | null
  decay_reason?: string | null
  status: IssueStatus
  lat: number
  lng: number
  image_url: string
  ai_summary: string
  suggested_authority: string
  complaint_draft: string | null
  embedding: number[] | null
  vote_count?: number
  created_at: string
}

export interface Vote {
  id: string
  issue_id: string
  user_id: string
  created_at: string
}

export interface Comment {
  id: string
  issue_id: string
  user_id: string
  body: string
  created_at: string
}
