// Utility functions for processing text and handling HTML tags

/**
 * Converts HTML tags to proper markdown formatting
 * @param {string} text - The text containing HTML tags
 * @returns {string} - Cleaned text with proper markdown
 */
export const cleanHtmlTags = (text) => {
  if (!text || typeof text !== 'string') return text;

  return text
    // Convert <br> tags to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert <br/> tags to newlines
    .replace(/<br\/>/gi, '\n')
    // Convert <p> tags to double newlines (paragraph breaks)
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    // Convert <strong> and <b> tags to markdown bold
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    // Convert <em> and <i> tags to markdown italic
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Convert <ul> and <ol> tags to markdown lists
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    // Convert <li> tags to markdown list items
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // Convert <h1> to <h6> tags to markdown headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n')
    // Convert <code> tags to markdown code
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    // Convert <pre> tags to markdown code blocks
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '\n```\n$1\n```\n')
    // Convert <a> tags to markdown links
    .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Remove any remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim();
};

/**
 * Processes numbered lists that might be broken by HTML tags
 * @param {string} text - The text to process
 * @returns {string} - Text with properly formatted numbered lists
 */
export const fixNumberedLists = (text) => {
  if (!text || typeof text !== 'string') return text;

  return text
    // Fix numbered lists that got broken by <br> tags
    .replace(/(\d+\.\s*[^<]*?)<br\s*\/?>\s*(\d+\.)/gi, '$1\n$2')
    // Fix numbered lists with <br/> tags
    .replace(/(\d+\.\s*[^<]*?)<br\/>\s*(\d+\.)/gi, '$1\n$2')
    // Fix the specific case: "1. text<br>2. text<br>3. text"
    .replace(/(\d+\.\s*[^<]*?)<br\s*\/?>\s*(\d+\.\s*[^<]*?)<br\s*\/?>\s*(\d+\.)/gi, '$1\n$2\n$3')
    // Handle multiple consecutive <br> tags in numbered lists
    .replace(/(\d+\.\s*[^<]*?)(<br\s*\/?>\s*)+(\d+\.)/gi, '$1\n$3')
    // Ensure proper spacing for numbered lists
    .replace(/(\d+\.\s*[^<]*?)\n\s*(\d+\.)/gi, '$1\n$2')
    // Clean up any remaining <br> tags in numbered lists
    .replace(/(\d+\.\s*[^<]*?)<br\s*\/?>/gi, '$1');
};

/**
 * Main function to process and clean text content
 * @param {string} text - The raw text content
 * @returns {string} - Cleaned and properly formatted text
 */
export const processTextContent = (text) => {
  if (!text || typeof text !== 'string') return text;

  let processedText = text;
  
  // Handle the specific case you mentioned first
  processedText = processedText
    // Fix "1. text<br>2. text<br>3. text" pattern
    .replace(/(\d+\.\s*[^<]*?)<br\s*\/?>\s*(\d+\.\s*[^<]*?)<br\s*\/?>\s*(\d+\.\s*[^<]*?)<br\s*\/?>\s*(\d+\.)/gi, '$1\n$2\n$3\n$4')
    // Handle any remaining numbered lists with <br> tags
    .replace(/(\d+\.\s*[^<]*?)<br\s*\/?>\s*(\d+\.)/gi, '$1\n$2');
  
  // Then clean all other HTML tags
  processedText = cleanHtmlTags(processedText);
  
  // Finally fix any remaining numbered list formatting
  processedText = fixNumberedLists(processedText);
  
  return processedText;
}; 