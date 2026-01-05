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

// Maximum posts to add per day
const MAX_DAILY_POSTS = 4

interface RSSItem {
  title: string
  link: string
  source: string
  description?: string
}

interface MicroJudgment {
  en: string
  it: string
}

interface RankedItem extends RSSItem {
  score: number
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
    
    // Parse Atom feeds (Reddit, etc.)
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi
    let match
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1]
      const titleMatch = entry.match(/<title[^>]*>([^<]*)<\/title>/i)
      const linkMatch = entry.match(/<link[^>]*href="([^"]*)"[^>]*>/i)
      const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/i)
      
      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
          link: linkMatch[1],
          source: new URL(url).hostname.replace('www.', ''),
          description: contentMatch ? contentMatch[1].substring(0, 200) : undefined
        })
      }
    }
    
    // Parse RSS 2.0 feeds (Product Hunt, etc.)
    if (items.length === 0) {
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi
      while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1]
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)
        const linkMatch = item.match(/<link>([^<]*)<\/link>/i)
        const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)
        
        if (titleMatch && linkMatch) {
          items.push({
            title: titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
            link: linkMatch[1].trim(),
            source: new URL(url).hostname.replace('www.', ''),
            description: descMatch ? descMatch[1].substring(0, 200) : undefined
          })
        }
      }
    }
    
    console.log(`Parsed ${items.length} items from ${url}`)
    return items.slice(0, 15) // Limit per feed
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error)
    return []
  }
}

async function rankItemsWithAI(items: RSSItem[]): Promise<RankedItem[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  
  if (!LOVABLE_API_KEY || items.length === 0) {
    // Fallback: random selection with basic scoring
    return items.map(item => ({
      ...item,
      score: Math.random() * 10
    }))
  }

  try {
    console.log(`Ranking ${items.length} items with AI...`)
    
    const titlesForRanking = items.slice(0, 30).map((item, i) => `${i + 1}. ${item.title}`).join('\n')
    
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
            content: `You are an editorial curator for KETOGO, a quirky product/discovery site. Your job is to select the 4-6 MOST interesting, unusual, or noteworthy items from a list. 
            
Prefer items that are:
- Genuinely quirky, weird, or unexpected
- Innovative products or discoveries
- Visually interesting or satisfying
- Have storytelling potential

AVOID items that are:
- Generic product launches without unique angle
- Too technical/developer-focused without mass appeal
- Boring or mundane
- Single word titles without context

Return ONLY a JSON array of the item numbers you select, ranked by interest. Example: [3, 7, 1, 12]`
          },
          {
            role: 'user',
            content: `Select the ${MAX_DAILY_POSTS} most interesting items:\n\n${titlesForRanking}`
          }
        ],
      }),
    })

    if (!response.ok) {
      console.error('AI ranking failed:', response.status)
      return items.map(item => ({ ...item, score: Math.random() * 10 }))
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // Parse the ranking array
    const jsonMatch = content.match(/\[[\d,\s]+\]/)
    if (jsonMatch) {
      const rankings: number[] = JSON.parse(jsonMatch[0])
      console.log('AI selected items:', rankings)
      
      return items.map((item, index) => {
        const rankPosition = rankings.indexOf(index + 1)
        return {
          ...item,
          score: rankPosition >= 0 ? (rankings.length - rankPosition) * 10 : 0
        }
      })
    }
    
    return items.map(item => ({ ...item, score: Math.random() * 10 }))
  } catch (error) {
    console.error('Error ranking items:', error)
    return items.map(item => ({ ...item, score: Math.random() * 10 }))
  }
}

async function generateMicroJudgment(title: string, description?: string): Promise<MicroJudgment> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured')
    return { en: '', it: '' }
  }

  try {
    console.log(`Generating micro-judgment for: ${title}`)
    
    const context = description ? `Title: "${title}"\nContext: ${description}` : `Title: "${title}"`
    
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
            content: `You are a witty editorial assistant for KETOGO, a quirky product discovery site. Generate a brief, clever micro-judgment (10-20 words) that captures why this observation is interesting or noteworthy.

Style guidelines:
- Be observational and slightly ironic
- Think "smart friend's quick take"
- Can be playful, surprising, or insightful
- NEVER just describe what the item is
- Add a unique perspective or commentary

Return JSON: {"en": "english judgment", "it": "italian judgment"}`
          },
          {
            role: 'user',
            content: context
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

async function checkDailyQuota(supabase: any): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  
  const { count, error } = await supabase
    .from('observations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${today}T23:59:59Z`)
  
  if (error) {
    console.error('Error checking daily quota:', error)
    return MAX_DAILY_POSTS // Assume quota met on error
  }
  
  console.log(`Posts today: ${count || 0}/${MAX_DAILY_POSTS}`)
  return count || 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting RSS fetch with AI curation...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Check how many posts we've added today
    const postsToday = await checkDailyQuota(supabase)
    const remainingQuota = Math.max(0, MAX_DAILY_POSTS - postsToday)
    
    if (remainingQuota === 0) {
      console.log('Daily quota reached, skipping...')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Daily quota of 4 posts already reached',
          postsToday
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Fetch all RSS feeds
    const allItems: RSSItem[] = []
    for (const feed of RSS_FEEDS) {
      const items = await parseRSSFeed(feed)
      allItems.push(...items)
    }
    
    console.log(`Total items fetched: ${allItems.length}`)
    
    // Filter out items that already exist
    const newItems: RSSItem[] = []
    for (const item of allItems) {
      const { data: existing } = await supabase
        .from('observations')
        .select('id')
        .eq('title_en', item.title)
        .maybeSingle()
      
      if (!existing) {
        newItems.push(item)
      }
    }
    
    console.log(`New items to consider: ${newItems.length}`)
    
    if (newItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new items found',
          postsToday
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Rank items with AI to select the best ones
    const rankedItems = await rankItemsWithAI(newItems)
    const topItems = rankedItems
      .sort((a, b) => b.score - a.score)
      .slice(0, remainingQuota)
    
    console.log(`Selected ${topItems.length} top items to insert`)
    
    // Insert selected items with AI micro-judgments
    let inserted = 0
    for (const item of topItems) {
      // Generate AI micro-judgment
      const judgment = await generateMicroJudgment(item.title, item.description)
      
      // Only insert if we got a valid micro-judgment
      if (!judgment.en || judgment.en.length < 10) {
        console.log(`Skipping "${item.title}" - no valid micro-judgment generated`)
        continue
      }
      
      const { error } = await supabase
        .from('observations')
        .insert({
          title_en: item.title,
          source: item.source,
          source_url: item.link,
          micro_judgment_en: judgment.en,
          micro_judgment_it: judgment.it || null,
          approved: true
        })
      
      if (!error) {
        inserted++
        console.log(`✓ Inserted: ${item.title.substring(0, 50)}...`)
        console.log(`  Judgment: ${judgment.en}`)
      } else {
        console.error('Insert error:', error)
      }
    }
    
    console.log(`Inserted ${inserted} new curated observations`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        fetched: allItems.length,
        newItems: newItems.length,
        inserted,
        postsToday: postsToday + inserted,
        dailyLimit: MAX_DAILY_POSTS,
        message: `Added ${inserted} curated posts (${postsToday + inserted}/${MAX_DAILY_POSTS} today)`
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
