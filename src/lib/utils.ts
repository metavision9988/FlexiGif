import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static readonly measurements = new Map<string, number>();
  
  static start(label: string): void {
    this.measurements.set(label, performance.now());
  }
  
  static end(label: string): number {
    const startTime = this.measurements.get(label);
    if (!startTime) {
      console.warn(`Performance measurement '${label}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.measurements.delete(label);
    
    console.log(`⏱️ ${label}: ${Math.round(duration)}ms`);
    return duration;
  }
  
  static measure<T>(label: string, fn: () => T): T;
  static measure<T>(label: string, fn: () => Promise<T>): Promise<T>;
  static measure<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.start(label);
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => this.end(label));
    }
    
    this.end(label);
    return result;
  }
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle utility for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): { used: number; total: number } {
  if ('memory' in performance) {
    const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize
    };
  }
  
  return { used: 0, total: 0 };
}

/**
 * Safe error handling with context
 */
export function handleError(
  error: unknown, 
  context: string,
  fallback?: () => void
): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`❌ Error in ${context}:`, {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    memory: getMemoryUsage()
  });
  
  // Execute fallback if provided
  if (fallback) {
    try {
      fallback();
    } catch (fallbackError) {
      console.error(`❌ Fallback failed in ${context}:`, fallbackError);
    }
  }
}

/**
 * Create a cancellable promise
 */
export function createCancellablePromise<T>(
  promise: Promise<T>
): { promise: Promise<T>; cancel: () => void } {
  let isCancelled = false;
  
  const cancellablePromise = new Promise<T>((resolve, reject) => {
    promise
      .then((result) => {
        if (!isCancelled) resolve(result);
      })
      .catch((error) => {
        if (!isCancelled) reject(error);
      });
  });
  
  return {
    promise: cancellablePromise,
    cancel: () => { isCancelled = true; }
  };
}