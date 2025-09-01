import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { query } = await request.json()

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Use a simple web search approach
    // In a production app, you'd integrate with Google Custom Search API, Bing Search API, etc.
    // For now, we'll simulate search results or use a free service
    
    const searchQuery = encodeURIComponent(query.trim())
    
    try {
      // Use DuckDuckGo Instant Answer API (free, no API key required)
      const duckduckgoUrl = `https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1&skip_disambig=1`
      
      const response = await fetch(duckduckgoUrl, {
        headers: {
          'User-Agent': 'ChatApp/1.0'
        }
      })
      
      if (!response.ok) {
        throw new Error('Search service unavailable')
      }
      
      const data = await response.json()
      
      // Format search results
      let searchResults = ''
      
      if (data.Abstract) {
        searchResults += `**${data.Heading || 'Search Result'}**\n\n${data.Abstract}\n\n`
      }
      
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        searchResults += '**Related Information:**\n'
        data.RelatedTopics.slice(0, 5).forEach((topic, index) => {
          if (topic.Text) {
            searchResults += `${index + 1}. ${topic.Text}\n`
          }
        })
        searchResults += '\n'
      }
      
      if (data.Answer) {
        searchResults += `**Quick Answer:** ${data.Answer}\n\n`
      }
      
      if (!searchResults) {
        searchResults = `I searched for "${query}" but didn't find specific results. Let me help you with general information about this topic instead.`
      }
      
      return NextResponse.json({
        query: query,
        results: searchResults,
        source: 'DuckDuckGo',
        success: true
      })
      
    } catch (searchError) {
      console.error('Search error:', searchError)
      
      // Fallback: return a message indicating search is unavailable
      return NextResponse.json({
        query: query,
        results: `I'm unable to search the web right now, but I can still help answer questions about "${query}" based on my training data. What would you like to know?`,
        source: 'fallback',
        success: true
      })
    }

  } catch (error) {
    console.error('Web search error:', error)
    return NextResponse.json({ 
      error: error.message || 'Search failed' 
    }, { status: 500 })
  }
}