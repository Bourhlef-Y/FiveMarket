import { supabase } from './supabaseClient'

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error.message)
    return null
  }
  return data.user
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Erreur lors de la récupération du profil:', error.message)
    return null
  }
  
  return data
} 