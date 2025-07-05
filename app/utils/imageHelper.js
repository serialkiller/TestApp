// Utility functions for handling images in AI responses

/**
 * Validates if a URL is a valid image URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if it's a valid image URL
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a valid URL
  try {
    new URL(url);
  } catch {
    return false;
  }
  
  // Check for common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const lowerUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('data:image/') ||
         lowerUrl.includes('blob:');
};

/**
 * Extracts image URLs from markdown text
 * @param {string} text - The markdown text
 * @returns {Array} - Array of image URLs found
 */
export const extractImageUrls = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const matches = [];
  let match;
  
  while ((match = imageRegex.exec(text)) !== null) {
    if (isValidImageUrl(match[1])) {
      matches.push(match[1]);
    }
  }
  
  return matches;
};

/**
 * Checks if text contains image references
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains image references
 */
export const hasImageReferences = (text) => {
  return extractImageUrls(text).length > 0;
};

/**
 * Suggests image usage for certain types of prompts
 * @param {string} prompt - The user's prompt
 * @returns {string|null} - Suggestion if applicable
 */
export const getImageSuggestion = (prompt) => {
  const visualKeywords = [
    'diagram', 'chart', 'graph', 'visual', 'picture', 'image', 'photo',
    'architecture', 'flowchart', 'mindmap', 'infographic', 'illustration',
    'screenshot', 'mockup', 'wireframe', 'prototype', 'design'
  ];
  
  const isVisualRequest = visualKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
  
  if (isVisualRequest) {
    return "💡 Tip: This request may benefit from visual aids. I'll include relevant images if available.";
  }
  
  return null;
}; 