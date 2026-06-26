export interface DashboardStats {
  total: number
  resolved: number
  critical: number
  rtiTriggered: number
  resolutionRate: number
}

export interface DecayBuckets {
  low: number
  medium: number
  high: number
}

export interface CategoryCounts {
  [category: string]: number
}
