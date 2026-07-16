// Simple demo admin authentication without database table
// For production, integrate with your actual admin user management system

export interface AdminAuthError {
  message: string
}

export interface AdminAuthResponse {
  success: boolean
  error?: AdminAuthError
  user?: any
  isAdmin?: boolean
}

// Demo admin credentials - you can modify these or connect to a real database
const DEMO_ADMINS = [
  { email: 'admin@cellkore.com', password: 'admin123', name: 'Admin User' },
  { email: 'demo@cellkore.com', password: 'demo123', name: 'Demo User' }
]

export async function adminSignIn(email: string, password: string): Promise<AdminAuthResponse> {
  try {
    // Find admin user in demo list
    const admin = DEMO_ADMINS.find(a => a.email === email && a.password === password)

    if (!admin) {
      return {
        success: false,
        error: { message: 'Invalid email or password' }
      }
    }

    // Store admin session in localStorage
    const adminSession = {
      email: admin.email,
      name: admin.name,
      loginTime: new Date().toISOString(),
      token: btoa(`${admin.email}:${Date.now()}`)
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('adminSession', JSON.stringify(adminSession))
    }

    return {
      success: true,
      user: { email: admin.email, name: admin.name },
      isAdmin: true
    }
  } catch (error) {
    return {
      success: false,
      error: { message: 'An unexpected error occurred' }
    }
  }
}

export async function adminSignOut(): Promise<AdminAuthResponse> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminSession')
    }
    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: { message: 'An unexpected error occurred' }
    }
  }
}

export function getAdminUser() {
  if (typeof window === 'undefined') return null

  try {
    const session = localStorage.getItem('adminSession')
    if (!session) return null
    return JSON.parse(session)
  } catch (error) {
    return null
  }
}

export function isUserAdmin(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const session = localStorage.getItem('adminSession')
    return !!session
  } catch (error) {
    return false
  }
}
