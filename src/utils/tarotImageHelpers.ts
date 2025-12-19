import { supabase } from '@/integrations/supabase/client';
import type { TarotCard } from '@/types/tarot';

const BUCKET_NAME = 'tarot-cards';
const BACK_PATH = 'backs/default.webp';

// Preload cache
const preloadedImages = new Map<string, Promise<void>>();
const loadedImages = new Set<string>();

/**
 * Get public URL for card back image
 */
export function getCardBackUrl(): string | null {
  try {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(BACK_PATH);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

/**
 * Get public URL for card face image
 * Falls back to null if no image available
 */
export function getCardFaceUrl(card: TarotCard): string | null {
  if (!card.image_url) {
    return null;
  }

  // If already a full URL, use as-is
  if (card.image_url.startsWith('http')) {
    return card.image_url;
  }

  // Otherwise, construct from storage
  try {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(card.image_url);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

/**
 * Preload an image and cache the promise
 * Returns a promise that resolves when the image is loaded and decoded
 */
export function preloadImage(url: string): Promise<void> {
  // Already loaded
  if (loadedImages.has(url)) {
    return Promise.resolve();
  }

  // Already loading
  if (preloadedImages.has(url)) {
    return preloadedImages.get(url)!;
  }

  // Start loading
  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Use decode() if available for smoother rendering
        if ('decode' in img && typeof img.decode === 'function') {
          await img.decode();
        }
        loadedImages.add(url);
        resolve();
      } catch {
        // decode() failed, but image is still loaded
        loadedImages.add(url);
        resolve();
      }
    };
    
    img.onerror = () => {
      preloadedImages.delete(url);
      reject(new Error(`Failed to load image: ${url}`));
    };
    
    img.src = url;
  });

  preloadedImages.set(url, promise);
  return promise;
}

/**
 * Preload card back image
 */
export async function preloadCardBack(): Promise<void> {
  const url = getCardBackUrl();
  if (url) {
    try {
      await preloadImage(url);
    } catch (e) {
      console.warn('Failed to preload card back:', e);
    }
  }
}

/**
 * Preload card face image
 */
export async function preloadCardFace(card: TarotCard): Promise<boolean> {
  const url = getCardFaceUrl(card);
  if (!url) {
    return false;
  }
  
  try {
    await preloadImage(url);
    return true;
  } catch (e) {
    console.warn('Failed to preload card face:', e);
    return false;
  }
}

/**
 * Check if an image is already loaded/cached
 */
export function isImageLoaded(url: string): boolean {
  return loadedImages.has(url);
}

/**
 * Clear the preload cache (useful for testing)
 */
export function clearPreloadCache(): void {
  preloadedImages.clear();
  loadedImages.clear();
}
