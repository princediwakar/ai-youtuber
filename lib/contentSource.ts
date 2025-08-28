import { config } from './config';

/**
 * Fetches external context for dynamic personas.
 * This is a critical module for time-sensitive content like news.
 * * @param persona The persona key (e.g., 'current_affairs').
 * @param topic The specific topic to fetch (e.g., 'National News').
 * @returns A promise that resolves to a string of context, or an empty string if not applicable.
 */
export async function getDynamicContext(persona: string, topic: string): Promise<string> {
  // Only fetch context for personas that require it.
  if (persona !== 'current_affairs') {
    return "";
  }

  try {
    console.log(`[Content Source] Fetching latest news for topic: ${topic}...`);
    
    // PRODUCTION IMPLEMENTATION:
    // ---------------------------
    // 1. Use a robust HTTP client like 'axios' or 'node-fetch'.
    // 2. Store the API Key for your news source in environment variables (e.g., process.env.NEWS_API_KEY).
    // 3. Construct the URL with appropriate query parameters (topic, language, country).
    // 4. Make the API call and parse the response, extracting the relevant article text or summary.
    // 5. Add caching (e.g., using Redis) to avoid hitting API rate limits on every single request.

    // Example with a placeholder:
    // const response = await fetch(`https://newsapi.org/v2/top-headlines?country=in&category=${topic}&apiKey=${process.env.NEWS_API_KEY}`);
    // if (!response.ok) {
    //   throw new Error(`News API responded with status: ${response.status}`);
    // }
    // const data = await response.json();
    // return data.articles[0]?.content || 'No relevant news found.';

    // Placeholder for development:
    return `On August 28, 2025, the Reserve Bank of India announced new guidelines for digital lending apps, focusing on enhancing consumer protection and data privacy. The framework requires all loan disbursals and repayments to be executed directly between the bank accounts of the borrower and the regulated entity.`;

  } catch (error) {
    console.error(`[Content Source] Failed to fetch dynamic content for "${topic}":`, error);
    // Return an empty string or handle the error as needed. Failing gracefully is important.
    return "Could not fetch latest news. Using general knowledge.";
  }
}