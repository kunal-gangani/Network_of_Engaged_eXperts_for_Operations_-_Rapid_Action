export interface ApiError {
  error: string
  status?: number
}

export interface ApiSuccess<T> {
  data: T
}

export interface CreateIssueBody {
  title: string
  description: string
  category: string
  severity: number
  lat: number
  lng: number
  image_url: string
  ai_summary: string
  suggested_authority: string
}
