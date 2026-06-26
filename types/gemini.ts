import { IssueCategory } from './issue'

export interface GeminiVisionResult {
  category: IssueCategory
  severity: number
  summary: string
  suggested_authority: string
}

export interface GeminiDecayResult {
  score: number
  reason: string
}

export interface GeminiResolutionStep {
  step: number
  action: string
  timeline: string
  responsible: string
}

export interface GeminiResolutionResult {
  steps: GeminiResolutionStep[]
  next_action: string
  expected_resolution_days: number
  department: string
}
