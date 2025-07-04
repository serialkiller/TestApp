// Storage configuration
export const STORAGE_CONFIG = {
  // Set to 'supabase' for cloud storage, 'local' for local storage only
  mode: 'supabase', // Options: 'supabase', 'local'
  
  // Supabase configuration (only needed if mode is 'supabase')
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Server-side only!
  },
  
  // Local storage configuration
  local: {
    maxConversations: 50,
    autoBackup: true, // Auto-backup to localStorage
  }
}

// Helper function to check if cloud storage is available
export const isCloudStorageAvailable = () => {
  const available = STORAGE_CONFIG.mode === 'supabase' && 
         STORAGE_CONFIG.supabase.url && 
         STORAGE_CONFIG.supabase.serviceKey
  
  console.log('Cloud storage available:', available)
  console.log('Storage mode:', STORAGE_CONFIG.mode)
  console.log('Supabase URL set:', !!STORAGE_CONFIG.supabase.url)
  console.log('Supabase key set:', !!STORAGE_CONFIG.supabase.serviceKey)
  
  return available
}

// Helper function to get storage mode
export const getStorageMode = () => {
  if (isCloudStorageAvailable()) {
    return 'supabase'
  }
  return 'local'
} 