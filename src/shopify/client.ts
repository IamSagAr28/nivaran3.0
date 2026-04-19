// src/shopify/client.ts
// Main Shopify Storefront API client with error handling and retries

import type {
  ShopifyProduct,
  ShopifyCollection,
  ShopifyCart,
  ShopifyShop,
  APIResponse,
} from './types';
import {
  SHOP_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  COLLECTIONS_QUERY,
  CREATE_CART_QUERY,
  ADD_TO_CART_QUERY,
  UPDATE_CART_QUERY,
  REMOVE_FROM_CART_QUERY,
  GET_CART_QUERY,
  SEARCH_PRODUCTS_QUERY,
  CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
  CUSTOMER_CREATE_MUTATION,
  CUSTOMER_QUERY,
  CUSTOMER_RECOVER_MUTATION,
  ARTICLES_QUERY,
  ARTICLE_BY_HANDLE_QUERY,
} from './queries';
import { getFromCache, setInCache, invalidateCache } from './cache';

// Configuration from environment variables
const SHOPIFY_STORE_URL = import.meta.env.VITE_SHOPIFY_STORE_URL || import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'nivaranupcyclers.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';
const SHOPIFY_API_VERSION = import.meta.env.VITE_SHOPIFY_API_VERSION || '2025-01'; // Updated to latest version

if (!SHOPIFY_STORE_URL || !SHOPIFY_STOREFRONT_TOKEN) {
  console.error('❌ Missing Shopify environment variables');
  console.error('Required: VITE_SHOPIFY_STORE_URL and VITE_SHOPIFY_STOREFRONT_TOKEN');
  console.error('Create .env.local file with your Shopify credentials');
}

const API_ENDPOINT = `https://${SHOPIFY_STORE_URL}/api/${SHOPIFY_API_VERSION}/graphql.json`;

console.log('🏪 Shopify Configuration:', {
  store: SHOPIFY_STORE_URL,
  apiVersion: SHOPIFY_API_VERSION,
  endpoint: API_ENDPOINT,
  tokenPreview: SHOPIFY_STOREFRONT_TOKEN ? SHOPIFY_STOREFRONT_TOKEN.substring(0, 10) + '...' : ''
});

interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
}

interface GraphQLError {
  message: string;
  extensions?: {
    code: string;
  };
}

/**
 * Execute a GraphQL query against Shopify Storefront API
 */
async function executeGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>,
  options: { cache?: boolean; cacheTTL?: number } = {}
): Promise<T> {
  const { cache = true, cacheTTL = 60 * 1000 } = options;

  // Try to get from cache first
  if (cache) {
    const operationName = extractOperationName(query);
    const cached = getFromCache<T>(operationName, variables);
    if (cached) {
      console.log('✅ Cache hit:', operationName);
      return cached;
    }
  }

  const payload: GraphQLQuery = {
    query,
    ...(variables && { variables }),
  };

  console.log('🌐 Making Shopify API request to:', API_ENDPOINT);
  console.log('🔑 Using token:', SHOPIFY_STOREFRONT_TOKEN ? SHOPIFY_STOREFRONT_TOKEN.substring(0, 10) + '...' : '');

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const result: APIResponse<T> = await response.json();
    console.log('📦 Response data:', result);

    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map((e) => e.message).join(', ');
      throw new Error(`GraphQL Error: ${errorMessages}`);
    }

    if (!result.data) {
      throw new Error('No data returned from Shopify API');
    }

    // Cache successful response
    if (cache) {
      const operationName = extractOperationName(query);
      setInCache(operationName, result.data, cacheTTL, variables);
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Shopify API request timed out after 10 seconds');
      throw new Error('Shopify API request timed out. Please check your internet connection and Shopify credentials.');
    }
    console.error('❌ Shopify API Error:', error);
    throw error;
  }
}

/**
 * Extract operation name from GraphQL query for caching purposes
 */
function extractOperationName(query: string): string {
  const match = query.match(/(?:query|mutation)\s+(\w+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Normalize cart data from Shopify API response
 * Converts lines.edges[] array to lines[] array
 */
function normalizeCart(cart: any): ShopifyCart {
  if (!cart) return cart;

  // If lines has edges, extract the nodes
  if (cart.lines && cart.lines.edges && Array.isArray(cart.lines.edges)) {
    return {
      ...cart,
      lines: cart.lines.edges.map((edge: any) => edge.node),
    };
  }

  return cart;
}

/**
 * Format price for display in Indian Rupees
 */
export function formatPrice(
  amount: string,
  currencyCode: string = 'INR'
): string {
  const numAmount = parseFloat(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
  return formatted;
}

/**
 * Optimize Shopify image URL for different sizes
 * Example: imageUrl?width=300&height=300&crop=center
 */
export function getOptimizedImageUrl(
  url: string,
  width: number = 300,
  height: number = 300
): string {
  if (!url) return '';

  // If URL already has parameters, append with &
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&h=${height}&fit=crop`;
}

/**
 * Get all products with pagination
 */
export async function fetchProducts(
  limit: number = 50
): Promise<ShopifyProduct[]> {
  try {
    const data = await executeGraphQL<{
      products: {
        edges: Array<{ node: ShopifyProduct }>;
      };
    }>(PRODUCTS_QUERY, { first: limit }, { cacheTTL: 60 * 1000 });

    return data.products.edges.map((edge) => edge.node);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}

/**
 * Get a single product by handle (slug)
 */
export async function fetchProductByHandle(
  handle: string
): Promise<ShopifyProduct | null> {
  try {
    const data = await executeGraphQL<{
      productByHandle: ShopifyProduct | null;
    }>(PRODUCT_BY_HANDLE_QUERY, { handle }, { cacheTTL: 5 * 60 * 1000 });

    return data.productByHandle;
  } catch (error) {
    console.error(`Failed to fetch product ${handle}:`, error);
    throw error;
  }
}

/**
 * Get all collections
 */
export async function fetchCollections(): Promise<ShopifyCollection[]> {
  try {
    const data = await executeGraphQL<{
      collections: {
        edges: Array<{ node: ShopifyCollection }>;
      };
    }>(COLLECTIONS_QUERY, { first: 50 }, { cacheTTL: 10 * 60 * 1000 });

    return data.collections.edges.map((edge) => edge.node);
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    throw error;
  }
}

/**
 * Get shop information
 */
export async function fetchShopInfo(): Promise<ShopifyShop> {
  try {
    const data = await executeGraphQL<{
      shop: ShopifyShop;
    }>(SHOP_QUERY, {}, { cacheTTL: 60 * 60 * 1000 }); // Cache for 1 hour

    return data.shop;
  } catch (error) {
    console.error('Failed to fetch shop info:', error);
    throw error;
  }
}

/**
 * Create a new cart
 */
export async function createCart(): Promise<ShopifyCart> {
  try {
    // Don't cache cart creation
    const data = await executeGraphQL<{
      cartCreate: {
        cart: ShopifyCart;
        userErrors: Array<{ message: string }>;
      };
    }>(CREATE_CART_QUERY, { input: {} }, { cache: false });

    if (data.cartCreate.userErrors.length > 0) {
      throw new Error(data.cartCreate.userErrors[0].message);
    }

    return normalizeCart(data.cartCreate.cart);
  } catch (error) {
    console.error('Failed to create cart:', error);
    throw error;
  }
}

/**
 * Get cart by ID
 */
export async function fetchCart(cartId: string): Promise<ShopifyCart | null> {
  try {
    const data = await executeGraphQL<{
      cart: ShopifyCart | null;
    }>(GET_CART_QUERY, { cartId }, { cache: false }); // Don't cache cart data

    return data.cart ? normalizeCart(data.cart) : null;
  } catch (error) {
    console.error(`Failed to fetch cart ${cartId}:`, error);
    throw error;
  }
}

/**
 * Add items to cart
 */
export async function addToCart(
  cartId: string,
  lines: Array<{ variantId: string; quantity: number; attributes?: { key: string; value: string }[] }>
): Promise<ShopifyCart> {
  try {
    // Invalidate cart cache
    invalidateCache('GetCart', { cartId });

    // Transform variantId to merchandiseId for Shopify API
    const transformedLines = lines.map(line => ({
      merchandiseId: line.variantId,
      quantity: line.quantity,
      attributes: line.attributes || []
    }));

    const data = await executeGraphQL<{
      cartLinesAdd: {
        cart: ShopifyCart;
        userErrors: Array<{ message: string; field: string[] }>;
      };
    }>(ADD_TO_CART_QUERY, { cartId, lines: transformedLines }, { cache: false });

    if (data.cartLinesAdd.userErrors.length > 0) {
      throw new Error(data.cartLinesAdd.userErrors[0].message);
    }

    return normalizeCart(data.cartLinesAdd.cart);
  } catch (error) {
    console.error('Failed to add to cart:', error);
    throw error;
  }
}

/**
 * Update cart line quantities
 */
export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>
): Promise<ShopifyCart> {
  try {
    invalidateCache('GetCart', { cartId });

    const data = await executeGraphQL<{
      cartLinesUpdate: {
        cart: ShopifyCart;
        userErrors: Array<{ message: string }>;
      };
    }>(UPDATE_CART_QUERY, { cartId, lines }, { cache: false });

    if (data.cartLinesUpdate.userErrors.length > 0) {
      throw new Error(data.cartLinesUpdate.userErrors[0].message);
    }

    return normalizeCart(data.cartLinesUpdate.cart);
  } catch (error) {
    console.error('Failed to update cart:', error);
    throw error;
  }
}

/**
 * Remove items from cart
 */
export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart> {
  try {
    invalidateCache('GetCart', { cartId });

    const data = await executeGraphQL<{
      cartLinesRemove: {
        cart: ShopifyCart;
        userErrors: Array<{ message: string }>;
      };
    }>(REMOVE_FROM_CART_QUERY, { cartId, lineIds }, { cache: false });

    if (data.cartLinesRemove.userErrors.length > 0) {
      throw new Error(data.cartLinesRemove.userErrors[0].message);
    }

    return normalizeCart(data.cartLinesRemove.cart);
  } catch (error) {
    console.error('Failed to remove from cart:', error);
    throw error;
  }
}

/**
 * Search products by query string
 */
export async function searchProducts(query: string): Promise<ShopifyProduct[]> {
  try {
    const data = await executeGraphQL<{
      search: {
        edges: Array<{ node: ShopifyProduct }>;
      };
    }>(SEARCH_PRODUCTS_QUERY, { query, first: 20 }, { cache: false });

    return data.search.edges.map((edge) => edge.node);
  } catch (error) {
    console.error('Failed to search products:', error);
    throw error;
  }
}

/**
 * Login a customer
 */
export async function login(email: string, password: string): Promise<{ accessToken: string; expiresAt: string }> {
  try {
    const data = await executeGraphQL<{
      customerAccessTokenCreate: {
        customerAccessToken: {
          accessToken: string;
          expiresAt: string;
        };
        customerUserErrors: Array<{ message: string }>;
      };
    }>(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION, {
      input: { email, password }
    }, { cache: false });

    if (data.customerAccessTokenCreate.customerUserErrors.length > 0) {
      throw new Error(data.customerAccessTokenCreate.customerUserErrors[0].message);
    }

    if (!data.customerAccessTokenCreate.customerAccessToken) {
      throw new Error('Invalid credentials');
    }

    return data.customerAccessTokenCreate.customerAccessToken;
  } catch (error) {
    console.error('Failed to login:', error);
    throw error;
  }
}

/**
 * Create a new customer account
 */
export async function signup(email: string, password: string, firstName?: string, lastName?: string): Promise<any> {
  try {
    const data = await executeGraphQL<{
      customerCreate: {
        customer: any;
        customerUserErrors: Array<{ message: string }>;
      };
    }>(CUSTOMER_CREATE_MUTATION, {
      input: { email, password, firstName, lastName }
    }, { cache: false });

    if (data.customerCreate.customerUserErrors.length > 0) {
      throw new Error(data.customerCreate.customerUserErrors[0].message);
    }

    return data.customerCreate.customer;
  } catch (error) {
    console.error('Failed to create account:', error);
    throw error;
  }
}

/**
 * Get customer details
 */
export async function getCustomer(accessToken: string): Promise<any> {
  try {
    const data = await executeGraphQL<{
      customer: any;
    }>(CUSTOMER_QUERY, { customerAccessToken: accessToken }, { cache: false });

    return data.customer;
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    throw error;
  }
}

/**
 * Recover password
 */
export async function recoverPassword(email: string): Promise<void> {
  try {
    const data = await executeGraphQL<{
      customerRecover: {
        customerUserErrors: Array<{ message: string }>;
      };
    }>(CUSTOMER_RECOVER_MUTATION, { email }, { cache: false });

    if (data.customerRecover.customerUserErrors.length > 0) {
      throw new Error(data.customerRecover.customerUserErrors[0].message);
    }
  } catch (error) {
    console.error('Failed to recover password:', error);
    throw error;
  }
}

/**
 * Check API connectivity and token validity
 */
export async function validateShopifyConnection(): Promise<boolean> {
  try {
    const shop = await fetchShopInfo();
    console.log(`✅ Shopify connected to: ${shop.name}`);
    return true;
  } catch (error) {
    console.error('❌ Shopify connection failed:', error);
    return false;
  }
}

export default {
  fetchProducts,
  fetchProductByHandle,
  fetchCollections,
  fetchShopInfo,
  createCart,
  fetchCart,
  addToCart,
  updateCartLines,
  removeFromCart,
  searchProducts,
  formatPrice,
  getOptimizedImageUrl,
  validateShopifyConnection,
  login,
  signup,
  getCustomer,
  recoverPassword,
  fetchArticles,
};

/**
 * Get latest articles from all blogs
 */

export async function fetchArticles(limit: number = 4): Promise<any[]> {
  try {
    const data = await executeGraphQL<{
      articles: {
        edges: Array<{ node: any }>;
      };
    }>(ARTICLES_QUERY, { first: limit }, { cache: false }); // No cache - always fetch fresh

    return data.articles.edges.map((edge) => edge.node);
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    // Return empty array instead of throwing to prevent UI crash
    return [];
  }
}

/**
 * Get a single article by handle
 */
export async function fetchArticleByHandle(blogHandle: string, articleHandle: string): Promise<any> {
  try {
    const data = await executeGraphQL<{
      blogByHandle: {
        articleByHandle: any;
      };
    }>(ARTICLE_BY_HANDLE_QUERY, { blogHandle, articleHandle }, { cache: true, cacheTTL: 60 * 1000 });

    if (!data.blogByHandle || !data.blogByHandle.articleByHandle) {
      return null;
    }
    return data.blogByHandle.articleByHandle;
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return null;
  }
}

