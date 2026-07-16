import { supabase } from './supabase'

export interface AuthError {
  message: string
}

export interface AuthResponse {
  success: boolean
  error?: AuthError
  user?: any
}

export async function signUp(email: string, password: string, fullName?: string, phone?: string, country?: string): Promise<AuthResponse> {
  try {
    console.log('Attempting signup with:', { email, fullName, phone, country })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          country: country,
        }
      }
    })

    console.log('Signup response:', { data, error })

    if (error) {
      return {
        success: false,
        error: { message: error.message }
      }
    }

    return {
      success: true,
      user: data.user
    }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      success: false,
      error: { message: 'An unexpected error occurred' }
    }
  }
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: { message: error.message }
      }
    }

    return {
      success: true,
      user: data.user
    }
  } catch (error) {
    return {
      success: false,
      error: { message: 'An unexpected error occurred' }
    }
  }
}

export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: { message: error.message }
      }
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

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    return null
  }
}

export async function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return subscription
}
