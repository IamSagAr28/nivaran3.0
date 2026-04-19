// src/hooks/useShopifyProducts.ts
// Custom hook for fetching and managing Shopify products

import { useState, useEffect, useCallback } from 'react';
import type { ShopifyProduct } from '../shopify/types';
import { fetchProducts, fetchProductByHandle, isShopifyConfigured } from '../shopify/client';

interface UseProductsState {
  products: ShopifyProduct[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useShopifyProducts(): UseProductsState {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      if (!isShopifyConfigured) {
        setProducts([]);
        setError(null);
        setLoading(false);
        return;
      }
      console.log('🔄 Starting to fetch products from Shopify...');
      setLoading(true);
      setError(null);
      const data = await fetchProducts(100);
      console.log('✅ Products fetched successfully:', data.length, 'products');
      console.log('📋 First product sample:', data[0]);
      setProducts(data);
    } catch (err) {
      console.error('❌ Failed to fetch products:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const refetch = useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    refetch,
  };
}

interface UseProductDetailState {
  product: ShopifyProduct | null;
  loading: boolean;
  error: Error | null;
}

export function useShopifyProductDetail(handle: string | undefined): UseProductDetailState {
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(!!handle);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!handle) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      try {
        if (!isShopifyConfigured) {
          setProduct(null);
          setError(null);
          return;
        }
        setLoading(true);
        setError(null);
        const data = await fetchProductByHandle(handle);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch product'));
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [handle]);

  return {
    product,
    loading,
    error,
  };
}

/**
 * Filter products by collection
 */
export function filterProductsByCollection(
  products: ShopifyProduct[],
  collectionHandle: string
): ShopifyProduct[] {
  return products.filter((product) =>
    product.collections.edges.some(
      (edge) => edge.node.handle === collectionHandle
    )
  );
}

/**
 * Filter products by tag
 */
export function filterProductsByTag(
  products: ShopifyProduct[],
  tag: string
): ShopifyProduct[] {
  return products.filter((product) =>
    product.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Sort products
 */
export function sortProducts(
  products: ShopifyProduct[],
  sortBy: 'price-asc' | 'price-desc' | 'newest' | 'title'
): ShopifyProduct[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) =>
        parseFloat(a.priceRange.minVariantPrice.amount) -
        parseFloat(b.priceRange.minVariantPrice.amount)
      );
    case 'price-desc':
      return sorted.sort((a, b) =>
        parseFloat(b.priceRange.maxVariantPrice.amount) -
        parseFloat(a.priceRange.maxVariantPrice.amount)
      );
    case 'newest':
      return sorted.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

/**
 * Search products
 */
export function searchProductsLocal(
  products: ShopifyProduct[],
  query: string
): ShopifyProduct[] {
  const lowerQuery = query.toLowerCase();
  return products.filter(
    (product) =>
      product.title.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.vendor.toLowerCase().includes(lowerQuery) ||
      product.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
