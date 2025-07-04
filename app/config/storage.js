// Storage configuration
export const STORAGE_CONFIG = {
  // Set to 'supabase' for cloud storage, 'local' for local storage only
  mode: 'supabase', // Options: 'supabase', 'local'
  
  // Supabase configuration (only needed if mode is 'supabase')
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    // Note: serviceKey is server-side only and not available on client
  },
  
  // Local storage configuration
  local: {
    maxConversations: 50,
    autoBackup: true, // Auto-backup to localStorage
  }
}

// Helper function to check if cloud storage is available
// This function works differently on client vs server
export const isCloudStorageAvailable = () => {
  // On client-side, we can only check if the URL is available
  // The service key is server-side only for security
  const isClient = typeof window !== 'undefined'
  
  if (isClient) {
    // Client-side: only check if URL is available
    const available = STORAGE_CONFIG.mode === 'supabase' && 
           STORAGE_CONFIG.supabase.url
    
    console.log('Cloud storage available (client):', available)
    console.log('Storage mode:', STORAGE_CONFIG.mode)
    console.log('Supabase URL set:', !!STORAGE_CONFIG.supabase.url)
    
    return available
  } else {
    // Server-side: check both URL and service key
    const available = STORAGE_CONFIG.mode === 'supabase' && 
           STORAGE_CONFIG.supabase.url && 
           process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Cloud storage available (server):', available)
    console.log('Storage mode:', STORAGE_CONFIG.mode)
    console.log('Supabase URL set:', !!STORAGE_CONFIG.supabase.url)
    console.log('Supabase key set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    return available
  }
}

// Helper function to get storage mode
export const getStorageMode = () => {
  if (isCloudStorageAvailable()) {
    return 'supabase'
  }
  return 'local'
} 