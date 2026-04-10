/**
 * Centralized API Client
 * Handles all communication with the backend search engine
 */

export interface FilterParams {
  keyword?: string;
  year?: string;
  judge?: string;
  caseType?: string;
  page?: number;
  limit?: number;
  country?: string;
}

export interface SearchParams {
  q?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export interface CaseData {
  caseId: string;
  title: string;
  description: string;
  date: string;
  citation: string;
  court: string;
  majorityOpinion: string;
  sourceLabel: string;
  judges: string;
  articleUrl: string;
  country: string;
}

export interface FilterResponse {
  success: boolean;
  results: CaseData[];
  totalResults: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

export interface SearchResponse {
  success: boolean;
  results: CaseData[];
  totalResults: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  indexStatus: Record<string, number>;
  cacheSize: number;
}

export interface RecentSearchesResponse {
  success: boolean;
  searches: Array<{ query: string; timestamp: number }>;
  totalSearches: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiClient {
  private baseUrl: string;
  private timeout = 30000; // 30 seconds
  private requestCache: Map<string, CacheEntry<unknown>> = new Map();
  private cacheExpiry = 60000; // 1 minute

  constructor() {
    this.baseUrl = this.getBaseUrl();
  }

  /**
   * Determine the correct API base URL
   */
  private getBaseUrl(): string {
    // If explicitly set in .env
    const viteUrl = (import.meta as Record<string, unknown>).env?.VITE_API_BASE_URL as string | undefined;
    if (viteUrl) {
      return viteUrl;
    }

    // In production, use relative URLs (Toolforge)
    const isProd = (import.meta as Record<string, unknown>).env?.PROD as boolean | undefined;
    if (isProd) {
      console.log("🌐 Production mode: using relative API paths");
      return "";
    }

    // In development, use localhost
    console.log("💻 Development mode: using http://localhost:9090");
    return "http://localhost:9090";
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.requestCache.clear();
    console.log("🗑️ API cache cleared");
  }

  /**
   * Get cached response if valid
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.requestCache.get(key) as CacheEntry<T> | undefined;
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.requestCache.delete(key);
      return null;
    }

    console.log("⚡ Cache hit:", key);
    return cached.data;
  }

  /**
   * Store response in cache
   */
  private setInCache<T>(key: string, data: T): void {
    this.requestCache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Make authenticated fetch request with timeout
   */
  private async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Filter cases using the search engine (uses in-memory index)
   * RECOMMENDED: Use this for filtering instead of /search
   */
  async filter(params: FilterParams): Promise<FilterResponse> {
    const queryParams = new URLSearchParams();

    if (params.keyword) queryParams.append("keyword", params.keyword);
    if (params.year) queryParams.append("year", params.year);
    if (params.judge) queryParams.append("judge", params.judge);
    if (params.caseType) queryParams.append("type", params.caseType);
    queryParams.append("page", (params.page || 1).toString());
    queryParams.append("limit", (params.limit || 10).toString());
    queryParams.append("country", params.country || "ghana");

    const url = `${this.baseUrl}/filter?${queryParams.toString()}`;
    const cacheKey = `filter:${url}`;

    // Check cache
    const cached = this.getFromCache<FilterResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.fetch(url);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        throw new Error((errorData.error as string) || `HTTP ${response.status}`);
      }

      const data: FilterResponse = await response.json();

      // Cache successful responses
      this.setInCache(cacheKey, data);

      return data;
    } catch (error) {
      throw new Error(`Filter failed: ${(error as Error).message}`);
    }
  }

  /**
   * Search cases (hits Wikidata - slower)
   * NOTE: Use /filter for better performance
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.append("q", params.q);
    queryParams.append("country", params.country || "ghana");
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const url = `${this.baseUrl}/search?${queryParams.toString()}`;

    try {
      const response = await this.fetch(url);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        throw new Error((errorData.error as string) || `HTTP ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get health status and index information
   */
  async health(): Promise<HealthResponse> {
    const url = `${this.baseUrl}/api/health`;

    try {
      const response = await this.fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: HealthResponse = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Health check failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get recent searches from session
   */
  async getRecentSearches(): Promise<RecentSearchesResponse> {
    const url = `${this.baseUrl}/api/recent-searches`;

    try {
      const response = await this.fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: RecentSearchesResponse = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Recent searches failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get available countries
   */
  async getCountries(): Promise<{ success: boolean; countries: CaseData[] }> {
    const url = `${this.baseUrl}/api/countries`;

    try {
      const response = await this.fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: { success: boolean; countries: CaseData[] } = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch countries: ${(error as Error).message}`);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export default apiClient;

