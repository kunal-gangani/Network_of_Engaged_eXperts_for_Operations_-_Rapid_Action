export interface UserProfile {
  id: string
  name: string
  email: string
  points: number
  badge: 'explorer' | 'guardian' | 'hero'
  created_at: string
}
