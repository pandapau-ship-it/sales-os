import type React from 'react'

export type UserRole = 'solo' | 'hunter' | 'farmer' | 'admin'

export type MainNavId =
  | 'mein-tag'
  | 'hunting'
  | 'farming'
  | 'marketing'
  | 'sherloq'
  | 'jira'

// Icon component type — compatible with @tabler/icons-react
export type IconComponent = React.ComponentType<{
  size?: number | string
  stroke?: number | string
  color?: string
}>

export interface MainNavItem {
  id: MainNavId
  label: string
  icon: IconComponent
  /** Which roles have access to this section */
  roles: UserRole[]
  /** Renders smaller with a visual separator before it — for Jira */
  secondary?: boolean
}

export interface SubNavItem {
  id: string
  label: string
  icon: IconComponent
  /** The main nav section this item belongs to */
  section: MainNavId
}

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
}
