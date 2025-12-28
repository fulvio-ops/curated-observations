import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSS feeds to monitor - diversified sources
const RSS_FEEDS = [
  // Reddit quirky discoveries
  'https://www.reddit.com/r/mildlyinteresting/.rss',
  'https://www.reddit.com/r/oddlysatisfying/.rss',
  'https://www.reddit.com/r/ofcoursethatsathing/.rss',
  // Product Hunt - new products
  'https://www.producthunt.com/feed',
  // Hacker News - tech discoveries
  'https://hnrss.org/frontpage',
  // ANSA.it - Italian news (curiosità section)
  'https://www.ansa.it/sito/ansait_rss.xml',
  // Design blogs
  'https://www.designboom.com/feed/',
  'https://www.yankodesign.com/feed/',
]

interface RSSItem {
  title: string
  link: string
  source: string
}

interface MicroJudgment {
  en: string
  it: string
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

async function generateMicroJudgment(title: string): Promise<MicroJudgment> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured')
    return { en: '', it: '' }
  }

  try {
    console.log(`Generating micro-judgment for: ${title}`)
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a witty editorial assistant for KETOGO, a quirky product discovery site. Generate brief, clever micro-judgments (max 15 words) that are observational, slightly ironic, and capture why something is interesting or noteworthy. Think of it as a smart friend's quick take. Respond in JSON format with "en" for English and "it" for Italian.`
          },
          {
            role: 'user',
            content: `Generate a micro-judgment for this observation: "${title}". Return JSON: {"en": "english judgment", "it": "italian judgment"}`
          }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', response.status, errorText)
      return { en: '', it: '' }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      console.log('Generated micro-judgment:', parsed)
      return {
        en: parsed.en || '',
        it: parsed.it || ''
      }
    }
    
    return { en: '', it: '' }
  } catch (error) {
    console.error('Error generating micro-judgment:', error)
    return { en: '', it: '' }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting RSS fetch with AI micro-judgments...')
    
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
    
    // Check for duplicates and insert new items with AI micro-judgments
    let inserted = 0
    for (const item of allItems) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('observations')
        .select('id')
        .eq('title_en', item.title)
        .maybeSingle()
      
      if (!existing) {
        // Generate AI micro-judgment for new items
        const judgment = await generateMicroJudgment(item.title)
        
        const { error } = await supabase
          .from('observations')
          .insert({
            title_en: item.title,
            source: item.source,
            source_url: item.link,
            micro_judgment_en: judgment.en || null,
            micro_judgment_it: judgment.it || null,
            approved: false // Requires manual approval
          })
        
        if (!error) {
          inserted++
          console.log(`Inserted observation with judgment: ${item.title.substring(0, 50)}...`)
        } else {
          console.error('Insert error:', error)
        }
      }
    }
    
    console.log(`Inserted ${inserted} new observations with AI micro-judgments`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        fetched: allItems.length,
        inserted,
        message: `Generated AI micro-judgments for ${inserted} new observations`
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
