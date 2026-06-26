export interface Authority {
  name: string
  department: string
  contact?: string
  email?: string
  jurisdiction?: string
}

export interface RTINotice {
  issue_id: string
  draft: string
  authority: string
  generated_at: string
}
