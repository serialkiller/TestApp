// Utility functions for processing file generation in AI responses

/**
 * Detects if a response contains file generation patterns
 * @param {string} text - The AI response text
 * @returns {Array} - Array of detected file information
 */
export const detectFiles = (text) => {
  if (!text || typeof text !== 'string') return [];

  const files = [];
  
  // Pattern 1: ```filename.ext ... ```
  const codeBlockPattern = /```(\w+\.\w+)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockPattern.exec(text)) !== null) {
    const fileName = match[1];
    const content = match[2].trim();
    
    files.push({
      fileName,
      content,
      type: 'code-block'
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
    } catch (error) {
      console.error(`Error uploading ${file.fileName}:`, error);
    }
  }

  return uploadedFiles;
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
export const mightContainFiles = (text) => {
  if (!text || typeof text !== 'string') return false;

  const fileKeywords = [
    'file', 'script', 'code', 'program', 'module', 'class',
    'function', 'component', 'service', 'utility', 'helper',
    'generated', 'created', 'here\'s', 'attached'
  ];

  const hasFileKeywords = fileKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );

  const hasCodeBlocks = text.includes('```');
  const hasFileExtensions = /\w+\.\w+/.test(text);

  return hasFileKeywords && hasCodeBlocks && hasFileExtensions;
}; 