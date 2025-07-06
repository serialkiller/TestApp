import { createClient } from '@supabase/supabase-js'

// File storage service for AI-generated files
export class FileStorage {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (this.supabaseUrl && this.supabaseKey) {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey)
    } else {
      console.warn('Supabase credentials not found, file storage disabled')
      this.supabase = null
    }
  }

  // Upload a file to Supabase storage
  async uploadFile(fileName, content, fileType = 'text/plain') {
    if (!this.supabase) {
      console.error('Supabase not initialized')
      return null
    }

    try {
      // Create a blob from the content
      const blob = new Blob([content], { type: fileType })
      
      // Generate a unique file path
      const timestamp = Date.now()
      const filePath = `ai-generated-files/${timestamp}-${fileName}`
      
      // Upload to Supabase storage
      const { data, error } = await this.supabase.storage
        .from('files')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading file:', error)
        // If bucket doesn't exist, provide helpful error message
        if (error.message.includes('bucket') || error.message.includes('not found')) {
          console.error('Storage bucket "files" not found. Please create it in Supabase Dashboard.')
        }
        return null
      }

      // Get the public URL
      const { data: urlData } = this.supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      return {
        id: data.path,
        fileName: fileName,
        fileUrl: urlData.publicUrl,
        fileType: fileType,
        size: blob.size,
        uploadedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error in uploadFile:', error)
      return null
    }
  }

  // Download a file from Supabase storage
  async downloadFile(fileUrl) {
    if (!this.supabase) {
      console.error('Supabase not initialized')
      return null
    }

    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const content = await response.text()
      return content
    } catch (error) {
      console.error('Error downloading file:', error)
      return null
    }
  }

  // Delete a file from Supabase storage
  async deleteFile(filePath) {
    if (!this.supabase) {
      console.error('Supabase not initialized')
      return false
    }

    try {
      const { error } = await this.supabase.storage
        .from('files')
        .remove([filePath])

      if (error) {
        console.error('Error deleting file:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteFile:', error)
      return false
    }
  }

  // Check if file storage is available
  isAvailable() {
    return !!this.supabase
  }
}

// Helper function to get file type from file name
export const getFileType = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const fileTypes = {
    // Programming languages
    'js': 'application/javascript',
    'jsx': 'application/javascript',
    'ts': 'application/typescript',
    'tsx': 'application/typescript',
    'py': 'text/x-python',
    'java': 'text/x-java-source',
    'cpp': 'text/x-c++src',
    'c': 'text/x-csrc',
    'cs': 'text/x-csharp',
    'php': 'application/x-httpd-php',
    'rb': 'text/x-ruby',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'swift': 'text/x-swift',
    'kt': 'text/x-kotlin',
    'scala': 'text/x-scala',
    
    // Web technologies
    'html': 'text/html',
    'css': 'text/css',
    'scss': 'text/x-scss',
    'sass': 'text/x-sass',
    'json': 'application/json',
    'xml': 'application/xml',
    'yaml': 'text/x-yaml',
    'yml': 'text/x-yaml',
    
    // Configuration files
    'md': 'text/markdown',
    'txt': 'text/plain',
    'env': 'text/plain',
    'gitignore': 'text/plain',
    'dockerfile': 'text/plain',
    
    // Data files
    'csv': 'text/csv',
    'sql': 'text/x-sql',
    
    // Default
    'default': 'text/plain'
  }
  
  return fileTypes[extension] || fileTypes.default
}

// Helper function to get language for syntax highlighting
export const getLanguage = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const languages = {
    // Programming languages
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    
    // Web technologies
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    
    // Configuration files
    'md': 'markdown',
    'txt': 'text',
    'env': 'bash',
    'gitignore': 'gitignore',
    'dockerfile': 'dockerfile',
    
    // Data files
    'csv': 'csv',
    'sql': 'sql',
    
    // Default
    'default': 'text'
  }
  
  return languages[extension] || languages.default
} 