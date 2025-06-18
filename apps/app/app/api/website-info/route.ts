import { currentUser } from '@repo/auth/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Input schema validation
const requestSchema = z.object({
  websiteUrl: z.string().url('Invalid URL format'),
});

export async function POST(request: Request) {
  try {
    // Authenticate the request
    const user = await currentUser();
    console.log('Auth check for user:', user?.id || 'No user found');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = requestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.format() },
        { status: 400 }
      );
    }

    const { websiteUrl } = result.data;
    
    // Fetch website content
    let response: Response;
    try {
      console.log('Attempting to fetch website:', websiteUrl);
      
      // Add timeout and more detailed error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BeneeFit/1.0; +https://benee-fit.xyz)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal,
        redirect: 'follow',
        // @ts-ignore - Next.js specific option
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching website:', error);
      
      let errorMessage = 'fetch failed';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - the website took too long to respond';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          errorMessage = 'Could not resolve website domain - please check the URL';
        } else if (error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Connection refused - the website may be down';
        } else if (error.message.includes('ETIMEDOUT')) {
          errorMessage = 'Connection timeout - the website is not responding';
        } else {
          errorMessage = error.message;
        }
      }
      
      return NextResponse.json(
        { error: `Could not fetch website content: ${errorMessage}` }, 
        { status: 422 }
      );
    }
    
    const html = await response.text();
    
    // Extract information from HTML using basic metadata extraction
    const orgInfo = extractOrganizationInfo(html, websiteUrl);
    
    return NextResponse.json({ success: true, data: orgInfo });
  } catch (error) {
    console.error('Error processing website info request:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

interface OrganizationInfo {
  name: string;
  logoUrl: string | null;
  description: string | null;
}

function extractOrganizationInfo(html: string, baseUrl: string): OrganizationInfo {
  // Default values
  const result: OrganizationInfo = {
    name: '',
    logoUrl: null,
    description: null,
  };
  
  // Extract organization name from title or og:title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const siteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  
  if (siteNameMatch && siteNameMatch[1]) {
    result.name = siteNameMatch[1].trim();
  } else if (ogTitleMatch && ogTitleMatch[1]) {
    result.name = ogTitleMatch[1].trim();
  } else if (titleMatch && titleMatch[1]) {
    // Clean up common patterns in titles like "Home | Company Name" or "Company Name - Home"
    let title = titleMatch[1].trim();
    title = title.split(/\s*[|:-]\s*/)[0].trim();
    // Remove common words like "Home", "Welcome to", etc.
    title = title.replace(/^(Home|Welcome to|Homepage)\s*/i, '').trim();
    result.name = title;
  }
  
  // Extract logo from og:image or other common logo patterns
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const appleTouchIconMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  const faviconMatch = html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  
  if (ogImageMatch && ogImageMatch[1]) {
    result.logoUrl = resolveUrl(ogImageMatch[1], baseUrl);
  } else if (appleTouchIconMatch && appleTouchIconMatch[1]) {
    result.logoUrl = resolveUrl(appleTouchIconMatch[1], baseUrl);
  } else if (faviconMatch && faviconMatch[1]) {
    result.logoUrl = resolveUrl(faviconMatch[1], baseUrl);
  }
  
  // Extract description
  const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const metaDescriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  
  if (ogDescriptionMatch && ogDescriptionMatch[1]) {
    result.description = ogDescriptionMatch[1].trim();
  } else if (metaDescriptionMatch && metaDescriptionMatch[1]) {
    result.description = metaDescriptionMatch[1].trim();
  }
  
  return result;
}

// Helper function to resolve relative URLs
function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  try {
    const base = new URL(baseUrl);
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`;
    } else {
      // Remove the filename from the path if present
      const path = base.pathname.replace(/\/[^\/]*$/, '');
      return `${base.protocol}//${base.host}${path}${url}`;
    }
  } catch (e) {
    return url;
  }
}
