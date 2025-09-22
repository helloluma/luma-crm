import { createClient } from '@supabase/supabase-js';
import { CacheManager, QueryOptimizer, PerformanceMonitor } from './performance';

/**
 * Database optimization utilities for Supabase
 */

export class DatabaseOptimizer {
  private supabase: ReturnType<typeof createClient>;
  private cacheEnabled: boolean;

  constructor(supabaseClient: ReturnType<typeof createClient>, cacheEnabled = true) {
    this.supabase = supabaseClient;
    this.cacheEnabled = cacheEnabled;
  }

  /**
   * Optimized query with caching and performance monitoring
   */
  async optimizedQuery<T>(
    table: string,
    options: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
      cacheTtl?: number;
      cacheKey?: string;
    } = {}
  ): Promise<{ data: T[] | null; error: any; fromCache: boolean }> {
    const {
      select = '*',
      filters = {},
      orderBy,
      limit,
      offset,
      cacheTtl = 5 * 60 * 1000, // 5 minutes default
      cacheKey
    } = options;

    // Generate cache key
    const key = cacheKey || QueryOptimizer.generateCacheKey(table, filters, {
      select,
      orderBy,
      limit,
      offset
    });

    // Check cache first
    if (this.cacheEnabled) {
      const cached = CacheManager.get<T[]>(key);
      if (cached) {
        return { data: cached, error: null, fromCache: true };
      }
    }

    // Start performance monitoring
    const endTimer = PerformanceMonitor.start(`db_query_${table}`);

    try {
      let query = this.supabase.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([column, value]) => {
        if (Array.isArray(value)) {
          query = query.in(column, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle range queries, etc.
          if (value.gte !== undefined) query = query.gte(column, value.gte);
          if (value.lte !== undefined) query = query.lte(column, value.lte);
          if (value.gt !== undefined) query = query.gt(column, value.gt);
          if (value.lt !== undefined) query = query.lt(column, value.lt);
          if (value.like !== undefined) query = query.like(column, value.like);
          if (value.ilike !== undefined) query = query.ilike(column, value.ilike);
        } else {
          query = query.eq(column, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 20) - 1);
      }

      const { data, error } = await query;

      // Record performance
      const duration = endTimer();
      
      if (duration > 1000) { // Log slow queries
        console.warn(`Slow query detected: ${table} (${duration.toFixed(2)}ms)`);
      }

      // Cache successful results
      if (!error && data && this.cacheEnabled) {
        CacheManager.set(key, data, cacheTtl);
      }

      return { data, error, fromCache: false };
    } catch (error) {
      endTimer();
      return { data: null, error, fromCache: false };
    }
  }

  /**
   * Optimized insert with batch support
   */
  async optimizedInsert<T>(
    table: string,
    data: T | T[],
    options: {
      onConflict?: string;
      returning?: string;
      batchSize?: number;
    } = {}
  ): Promise<{ data: any; error: any }> {
    const { onConflict, returning = '*', batchSize = 100 } = options;
    const endTimer = PerformanceMonitor.start(`db_insert_${table}`);

    try {
      const records = Array.isArray(data) ? data : [data];
      
      // Handle large batches
      if (records.length > batchSize) {
        const results = [];
        const errors = [];

        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          let query = this.supabase.from(table).insert(batch);
          
          if (onConflict) {
            query = query.onConflict(onConflict);
          }
          
          const { data: batchData, error } = await query.select(returning);
          
          if (error) {
            errors.push(error);
          } else if (batchData) {
            results.push(...batchData);
          }
        }

        endTimer();
        
        return {
          data: results,
          error: errors.length > 0 ? errors : null
        };
      }

      // Single batch insert
      let query = this.supabase.from(table).insert(records);
      
      if (onConflict) {
        query = query.onConflict(onConflict);
      }
      
      const result = await query.select(returning);
      endTimer();
      
      return result;
    } catch (error) {
      endTimer();
      return { data: null, error };
    }
  }

  /**
   * Optimized update with conditional logic
   */
  async optimizedUpdate<T>(
    table: string,
    updates: Partial<T>,
    filters: Record<string, any>,
    options: {
      returning?: string;
      onlyIfChanged?: boolean;
    } = {}
  ): Promise<{ data: any; error: any }> {
    const { returning = '*', onlyIfChanged = true } = options;
    const endTimer = PerformanceMonitor.start(`db_update_${table}`);

    try {
      // If onlyIfChanged is true, first check if update is needed
      if (onlyIfChanged) {
        const { data: existing } = await this.optimizedQuery(table, { filters, limit: 1 });
        
        if (existing && existing.length > 0) {
          const record = existing[0] as any;
          const hasChanges = Object.entries(updates).some(([key, value]) => {
            return record[key] !== value;
          });
          
          if (!hasChanges) {
            endTimer();
            return { data: existing, error: null };
          }
        }
      }

      let query = this.supabase.from(table).update(updates);

      // Apply filters
      Object.entries(filters).forEach(([column, value]) => {
        query = query.eq(column, value);
      });

      const result = await query.select(returning);
      endTimer();
      
      // Invalidate related cache entries
      if (!result.error && this.cacheEnabled) {
        this.invalidateCache(table, filters);
      }
      
      return result;
    } catch (error) {
      endTimer();
      return { data: null, error };
    }
  }

  /**
   * Optimized delete with cascade handling
   */
  async optimizedDelete(
    table: string,
    filters: Record<string, any>,
    options: {
      cascade?: string[];
      returning?: string;
    } = {}
  ): Promise<{ data: any; error: any }> {
    const { cascade = [], returning } = options;
    const endTimer = PerformanceMonitor.start(`db_delete_${table}`);

    try {
      // Handle cascade deletes first
      if (cascade.length > 0) {
        for (const cascadeTable of cascade) {
          await this.supabase.from(cascadeTable).delete().match(filters);
        }
      }

      let query = this.supabase.from(table).delete();

      // Apply filters
      Object.entries(filters).forEach(([column, value]) => {
        query = query.eq(column, value);
      });

      if (returning) {
        query = query.select(returning);
      }

      const result = await query;
      endTimer();
      
      // Invalidate related cache entries
      if (!result.error && this.cacheEnabled) {
        this.invalidateCache(table, filters);
      }
      
      return result;
    } catch (error) {
      endTimer();
      return { data: null, error };
    }
  }

  /**
   * Invalidate cache entries for a table
   */
  private invalidateCache(table: string, filters: Record<string, any>): void {
    const stats = CacheManager.getStats();
    const keysToInvalidate = stats.keys.filter(key => key.startsWith(`${table}:`));
    
    keysToInvalidate.forEach(key => {
      CacheManager.clear();
    });
  }

  /**
   * Get database performance statistics
   */
  getPerformanceStats(): Record<string, any> {
    return PerformanceMonitor.getAllStats();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return CacheManager.getStats();
  }
}

/**
 * Database indexing recommendations
 */
export const DATABASE_INDEXES = {
  // Clients table indexes
  clients: [
    'CREATE INDEX IF NOT EXISTS idx_clients_assigned_agent ON clients(assigned_agent);',
    'CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);',
    'CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);',
    'CREATE INDEX IF NOT EXISTS idx_clients_search ON clients USING gin(to_tsvector(\'english\', name || \' \' || email));'
  ],
  
  // Transactions table indexes
  transactions: [
    'CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_closing_date ON transactions(closing_date);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_price ON transactions(price);'
  ],
  
  // Appointments table indexes
  appointments: [
    'CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);',
    'CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);',
    'CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);',
    'CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);',
    'CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(type);'
  ],
  
  // Documents table indexes
  documents: [
    'CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);',
    'CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);',
    'CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);'
  ],
  
  // Notifications table indexes
  notifications: [
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);',
    'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);'
  ]
};

/**
 * Generate SQL for creating all recommended indexes
 */
export function generateIndexSQL(): string {
  return Object.values(DATABASE_INDEXES)
    .flat()
    .join('\n');
}