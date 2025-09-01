import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { query } = await request.json()

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const q = query.trim()

    // Prefer a real search provider if API keys are available.
    // Supported env vars (set in .env): SERPAPI_KEY or BING_SEARCH_KEY
    const SERPAPI_KEY = process.env.SERPAPI_KEY
    const BING_KEY = process.env.BING_SEARCH_KEY

    // Helper to safely truncate text
    const truncate = (s, n = 300) => (s && s.length > n ? s.substring(0, n) + '...' : s)

    // Try SerpApi (Google) if key provided
    if (SERPAPI_KEY) {
      try {
        const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=google&api_key=${SERPAPI_KEY}`
        const resp = await fetch(serpUrl, { headers: { 'User-Agent': 'ChatApp/1.0' } })
        if (resp.ok) {
          const data = await resp.json()
          let out = `Search results for: **${q}**\n\n`

          // organic results
          if (data.organic_results && data.organic_results.length > 0) {
            out += '**Top web results:**\n'
            data.organic_results.slice(0, 5).forEach((r, i) => {
              out += `${i + 1}. [${r.title || truncate(r.snippet || r.description || '')}](${r.link || r.url || ''})\n`
              if (r.snippet || r.snippet === '') {
                out += `> ${truncate(r.snippet || r.description || '')}\n`
              }
            })
            out += '\n'
          }

          // news results if present
          if (data.news_results && data.news_results.length > 0) {
            out += '**News:**\n'
            data.news_results.slice(0, 5).forEach((n, i) => {
              out += `- [${n.title}](${n.link}) — ${truncate(n.snippet || '')}\n`
            })
            out += '\n'
          }

          // Answer box
          if (data.answer) {
            out += `**Answer:** ${truncate(data.answer, 1000)}\n\n`
          }

          return NextResponse.json({ query: q, results: out, source: 'SerpApi', success: true })
        }
      } catch (err) {
        console.error('SerpApi error:', err)
        // fallthrough to next provider
      }
    }

    // Try Bing Web Search if key provided
    if (BING_KEY) {
      try {
        const bingUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&mkt=en-US`
        const resp = await fetch(bingUrl, { headers: { 'Ocp-Apim-Subscription-Key': BING_KEY, 'User-Agent': 'ChatApp/1.0' } })
        if (resp.ok) {
          const data = await resp.json()
          let out = `Search results for: **${q}**\n\n`

          if (data.webPages && data.webPages.value && data.webPages.value.length > 0) {
            out += '**Top web results:**\n'
            data.webPages.value.slice(0, 5).forEach((r, i) => {
              out += `${i + 1}. [${r.name}](${r.url})\n> ${truncate(r.snippet || '')}\n`
            })
            out += '\n'
          }

          if (data.news && data.news.value && data.news.value.length > 0) {
            out += '**News:**\n'
            data.news.value.slice(0, 5).forEach((n) => {
              out += `- [${n.name}](${n.url}) — ${truncate(n.description || '')}\n`
            })
            out += '\n'
          }

          return NextResponse.json({ query: q, results: out, source: 'Bing', success: true })
        }
      } catch (err) {
        console.error('Bing search error:', err)
        // fallthrough to fallback
      }
    }

    // Fallback to DuckDuckGo Instant Answer API (no API key required)
    try {
      const duckUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`
      const resp = await fetch(duckUrl, { headers: { 'User-Agent': 'ChatApp/1.0' } })
      if (!resp.ok) throw new Error('DuckDuckGo unavailable')
      const data = await resp.json()

      let searchResults = ''
      if (data.Heading || data.Abstract) {
        searchResults += `**${data.Heading || 'Search Result'}**\n\n${data.Abstract || ''}\n\n`
      }
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        searchResults += '**Related Information:**\n'
        data.RelatedTopics.slice(0, 5).forEach((topic, index) => {
          if (topic.Text) searchResults += `${index + 1}. ${topic.Text}\n`
        })
        searchResults += '\n'
      }
      if (data.Answer) searchResults += `**Quick Answer:** ${data.Answer}\n\n`
      if (!searchResults) searchResults = `I searched for "${q}" but didn't find specific results.`

      return NextResponse.json({ query: q, results: searchResults, source: 'DuckDuckGo', success: true })
    } catch (duckErr) {
      console.error('DuckDuckGo fallback error:', duckErr)
      return NextResponse.json({ query: q, results: `I'm unable to search the web right now.`, source: 'fallback', success: false })
    }

  } catch (error) {
    console.error('Web search error:', error)
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 })
  }
}