import { supabase } from './supabase'

// Admin email - CHANGE THIS TO YOUR EMAIL
const ADMIN_EMAIL = 'iamthatlolu@gmail.com' // ⚠️ CHANGE THIS TO YOUR ACTUAL EMAIL

export async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false
    
    // Check if the user's email matches the admin email
    return user.email === ADMIN_EMAIL
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}
