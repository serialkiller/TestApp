// Utility functions for handling comparisons and tabulated data

/**
 * Formats a comparison prompt to encourage table responses
 * @param {string} prompt - The original comparison prompt
 * @returns {string} - Formatted prompt that encourages table format
 */
export const formatComparisonPrompt = (prompt) => {
  // Check if the prompt is asking for a comparison
  const comparisonKeywords = [
    'compare', 'comparison', 'difference', 'versus', 'vs', 'vs.', 
    'similarities', 'differences', 'pros and cons', 'advantages and disadvantages'
  ];
  
  const isComparison = comparisonKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
  
  if (isComparison) {
    return `${prompt}\n\nPlease provide your response in a table format for better readability.`;
  }
  
  return prompt;
};

/**
 * Detects if a response contains tabular data
 * @param {string} response - The AI response text
 * @returns {boolean} - True if response contains table markers
 */
export const hasTableData = (response) => {
  const tableMarkers = [
    '|', // Markdown table syntax
    '\t', // Tab-separated
    'table',
    'comparison'
  ];
  
  return tableMarkers.some(marker => response.includes(marker));
};

/**
 * Suggests table format for comparison prompts
 * @param {string} prompt - The user's prompt
 * @returns {string|null} - Suggestion if applicable
 */
export const getTableSuggestion = (prompt) => {
  const comparisonKeywords = [
    'compare', 'comparison', 'difference', 'versus', 'vs', 'vs.', 
    'similarities', 'differences', 'pros and cons', 'advantages and disadvantages'
  ];
  
  const isComparison = comparisonKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
  
  if (isComparison) {
    return "💡 Tip: I'll format this comparison in a table for better readability.";
  }
  
  return null;
}; 