// Utility functions for processing file generation in AI responses

/**
 * Detects if a response contains file generation patterns
 * @param {string} text - The AI response text
 * @returns {Array} - Array of detected file information
 */
export const detectFiles = (text) => {
  if (!text || typeof text !== 'string') return [];

  const files = [];
  
  // Pattern 1: ```filename.ext ... ``` (including PowerPoint and PDF files)
  const codeBlockPattern = /```([\w.-]+\.(js|jsx|ts|tsx|py|java|cpp|c|cs|php|rb|go|rs|swift|html|css|json|md|sql|txt|xml|yaml|yml|pptx|pdf|docx|xlsx|csv))\n([\s\S]*?)```/gi;
  let match;
  
  while ((match = codeBlockPattern.exec(text)) !== null) {
    const fileName = match[1];
    const content = match[3].trim();
    
    files.push({
      fileName,
      content,
      type: 'code-block',
      fileType: getFileType(fileName)
    });
  }
  
  // Pattern 1.5: ```filename.ext (without newline) ... ```
  const codeBlockPattern2 = /```(\w+\.\w+)([^`]*?)```/g;
  
  while ((match = codeBlockPattern2.exec(text)) !== null) {
    const fileName = match[1];
    const content = match[2].trim();
    
    // Skip if we already found this file
    if (!files.find(f => f.fileName === fileName && f.type === 'code-block')) {
      files.push({
        fileName,
        content,
        type: 'code-block'
      });
    }
  }
  
  // Pattern 1.6: ```language (when filename is mentioned in text) ... ```
  // Look for code blocks with language identifiers when filename is mentioned nearby
  const languagePattern = /```(\w+)\n([\s\S]*?)```/g;
  const filenameMentions = text.match(/(\w+\.\w+)/g) || [];
  
  while ((match = languagePattern.exec(text)) !== null) {
    const language = match[1];
    const content = match[2].trim();
    
    // Check if there's a filename mentioned in the text before this code block
    const beforeText = text.substring(0, match.index);
    const filenameMatch = beforeText.match(/(\w+\.\w+)/);
    
    if (filenameMatch) {
      const fileName = filenameMatch[1];
      
      // Skip if we already found this file
      if (!files.find(f => f.fileName === fileName)) {
        files.push({
          fileName,
          content,
          type: 'language-block'
        });
      }
    }
  }
  
  // Pattern 2: **filename.ext** followed by code
  const boldFilePattern = /\*\*(\w+\.\w+)\*\*\s*\n```[\s\S]*?```/g;
  
  while ((match = boldFilePattern.exec(text)) !== null) {
    const fileName = match[1];
    // Extract the content from the code block
    const codeBlockMatch = text.substring(match.index).match(/```[\s\S]*?```/);
    if (codeBlockMatch) {
      const content = codeBlockMatch[0].replace(/```/g, '').trim();
      
      files.push({
        fileName,
        content,
        type: 'bold-file'
      });
    }
  }
  
  // Pattern 3: "Here's the file:" followed by filename and content
  const fileIntroPattern = /(?:Here'?s?|I'?ve? created|Generated) (?:the |a )?file:?\s*\n?\*?(\w+\.\w+)\*?\s*\n```[\s\S]*?```/gi;
  
  while ((match = fileIntroPattern.exec(text)) !== null) {
    const fileName = match[1];
    const codeBlockMatch = text.substring(match.index).match(/```[\s\S]*?```/);
    if (codeBlockMatch) {
      const content = codeBlockMatch[0].replace(/```/g, '').trim();
      
      files.push({
        fileName,
        content,
        type: 'file-intro'
      });
    }
  }
  
  return files;
};

/**
 * Uploads detected files to storage
 * @param {Array} files - Array of file objects
 * @returns {Array} - Array of uploaded file information
 */
export const uploadFiles = async (files) => {
  if (!files || files.length === 0) return [];

  const uploadedFiles = [];

  for (const file of files) {
    try {
      // Check if this is a PDF file that needs special processing
      if (file.fileName.toLowerCase().endsWith('.pdf')) {
        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.fileName,
            content: file.content,
            title: extractTitleFromContent(file.content)
          }),
        });

        if (response.ok) {
          const data = await response.json();
          uploadedFiles.push({
            fileName: data.fileName,
            fileUrl: data.downloadUrl,
            uploadedAt: new Date().toISOString(),
            size: data.size || 0,
            fileType: 'application/pdf',
            isPdf: true
          });
        } else {
          console.error(`Failed to generate PDF ${file.fileName}:`, await response.text());
        }
      } else {
        // Regular file upload
        const response = await fetch('/api/upload-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.fileName,
            content: file.content
          }),
        });

        if (response.ok) {
          const data = await response.json();
          uploadedFiles.push(data.fileInfo);
        } else {
          console.error(`Failed to upload ${file.fileName}:`, await response.text());
        }
      }
    } catch (error) {
      console.error(`Error processing ${file.fileName}:`, error);
    }
  }

  return uploadedFiles;
};

/**
 * Extracts title from markdown content
 * @param {string} content - The file content
 * @returns {string} - Extracted title or default
 */
const extractTitleFromContent = (content) => {
  if (!content) return 'Generated Report';
  
  // Look for the first # heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Look for any heading
  const anyHeadingMatch = content.match(/^#+\s+(.+)$/m);
  if (anyHeadingMatch) {
    return anyHeadingMatch[1].trim();
  }
  
  return 'Generated Report';
};

/**
 * Replaces file content in text with file display placeholders
 * @param {string} text - The original text
 * @param {Array} files - Array of detected file objects (not uploaded files)
 * @returns {string} - Text with file placeholders
 * @deprecated This function is deprecated. File display is now handled directly in the component to avoid DOM nesting issues.
 */
export const replaceFilesWithPlaceholders = (text, files) => {
  return text;
};

/**
 * Checks if a response might contain file generation
 * @param {string} text - The AI response text
 * @returns {boolean} - True if response might contain files
 */
/**
 * Determines the file type based on extension
 * @param {string} fileName - The file name
 * @returns {string} - The file type category
 */
export const getFileType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  
  const fileTypes = {
    // Code files
    'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
    'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'cs': 'csharp',
    'php': 'php', 'rb': 'ruby', 'go': 'go', 'rs': 'rust', 'swift': 'swift',
    
    // Web files
    'html': 'html', 'css': 'css', 'xml': 'xml',
    
    // Data files
    'json': 'json', 'yaml': 'yaml', 'yml': 'yaml', 'csv': 'csv',
    
    // Documentation
    'md': 'markdown', 'txt': 'text',
    
    // Database
    'sql': 'sql',
    
    // Office documents
    'pptx': 'powerpoint', 'pdf': 'pdf', 'docx': 'word', 'xlsx': 'excel'
  };
  
  return fileTypes[extension] || 'text';
};

/**
 * Checks if a response might contain file generation
 * @param {string} text - The AI response text
 * @returns {boolean} - True if response might contain files
 */
export const mightContainFiles = (text) => {
  if (!text || typeof text !== 'string') return false;

  const fileKeywords = [
    'file', 'script', 'code', 'program', 'module', 'class',
    'function', 'component', 'service', 'utility', 'helper',
    'generated', 'created', 'here\'s', 'attached', 'powerpoint',
    'presentation', 'report', 'pdf', 'document', 'spreadsheet'
  ];

  const hasFileKeywords = fileKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );

  const hasCodeBlocks = text.includes('```');
  const hasFileExtensions = /[\w.-]+\.(js|jsx|ts|tsx|py|java|cpp|c|cs|php|rb|go|rs|swift|html|css|json|md|sql|txt|xml|yaml|yml|pptx|pdf|docx|xlsx|csv)/i.test(text);
  const hasMultiFileIndicator = text.includes('📁 MULTIPLE FILES GENERATED') || text.includes('files that can be downloaded as a ZIP package');

  return (hasFileKeywords && hasCodeBlocks && hasFileExtensions) || hasMultiFileIndicator;
};

/**
 * Checks if the response contains multiple files
 * @param {string} text - The AI response text
 * @returns {boolean} - True if response contains multiple files
 */
export const isMultiFileResponse = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  return text.includes('📁 MULTIPLE FILES GENERATED') || 
         text.includes('files that can be downloaded as a ZIP package') ||
         (text.match(/```[\w.-]+\.\w+/g) || []).length > 1;
}; 