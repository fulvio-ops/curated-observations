import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSS feeds to monitor (can be expanded)
const RSS_FEEDS = [
  'https://www.reddit.com/r/mildlyinteresting/.rss',
  'https://www.reddit.com/r/oddlysatisfying/.rss',
  'https://www.reddit.com/r/ofcoursethatsathing/.rss',
]

interface RSSItem {
  title: string
  link: string
  source: string
}

async function parseRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    console.log(`Fetching RSS feed: ${url}`)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'KETOGO Editorial Bot/1.0'
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`)
      return []
    }
    
    const xml = await response.text()
    const items: RSSItem[] = []
    
    // Simple XML parsing for RSS/Atom feeds
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi
    const titleRegex = /<title[^>]*>([^<]*)<\/title>/i
    const linkRegex = /<link[^>]*href="([^"]*)"[^>]*>/i
    
    let match
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1]
      const titleMatch = entry.match(titleRegex)
      const linkMatch = entry.match(linkRegex)
      
      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].trim(),
          link: linkMatch[1],
          source: new URL(url).hostname.replace('www.', '')
        })
      }
    }
    
    console.log(`Parsed ${items.length} items from ${url}`)
    return items.slice(0, 10) // Limit to 10 items per feed
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error)
    return []
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting RSS fetch...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Fetch all RSS feeds
    const allItems: RSSItem[] = []
    for (const feed of RSS_FEEDS) {
      const items = await parseRSSFeed(feed)
      allItems.push(...items)
    }
    
    console.log(`Total items fetched: ${allItems.length}`)
    
    // Check for duplicates and insert new items
    let inserted = 0
    for (const item of allItems) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('observations')
        .select('id')
        .eq('title_en', item.title)
        .maybeSingle()
      
      if (!existing) {
        const { error } = await supabase
          .from('observations')
          .insert({
            title_en: item.title,
            source: item.source,
            source_url: item.link,
            approved: false // Requires manual approval
          })
        
        if (!error) {
          inserted++
        } else {
          console.error('Insert error:', error)
        }
      }
    }
    
    console.log(`Inserted ${inserted} new observations`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        fetched: allItems.length,
        inserted 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in fetch-rss:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
