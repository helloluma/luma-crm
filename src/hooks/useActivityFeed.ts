import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityWithUser } from '@/types'

interface UseActivityFeedOptions {
  limit?: number
  type?: string
  entityType?: string
  realtime?: boolean
}

interface UseActivityFeedReturn {
  activities: ActivityWithUser[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  createActivity: (activity: {
    type: string
    title: string
    description?: string
    entity_type?: string
    entity_id?: string
    metadata?: any
  }) => Promise<void>
}

export function useActivityFeed(options: UseActivityFeedOptions = {}): UseActivityFeedReturn {
  const { limit = 10, type, entityType, realtime = true } = options
  
  const [activities, setActivities] = useState<ActivityWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // Using the client-side supabase instance

  const fetchActivities = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
      })

      if (type) params.append('type', type)
      if (entityType) params.append('entity_type', entityType)

      const response = await fetch(`/api/activities?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch activities')
      }

      const newActivities = result.data || []
      
      if (append) {
        setActivities(prev => [...prev, ...newActivities])
      } else {
        setActivities(newActivities)
      }

      setHasMore(newActivities.length === limit)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [limit, type, entityType])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchActivities(page + 1, true)
  }, [fetchActivities, hasMore, loading, page])

  const refresh = useCallback(async () => {
    setPage(1)
    await fetchActivities(1, false)
  }, [fetchActivities])

  const createActivity = useCallback(async (activityData: {
    type: string
    title: string
    description?: string
    entity_type?: string
    entity_id?: string
    metadata?: any
  }) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create activity')
      }

      // Add the new activity to the beginning of the list
      setActivities(prev => [result.data, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity')
      throw err
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Set up real-time subscription
  useEffect(() => {
    if (!realtime) return

    const channel = supabase
      .channel('activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        async (payload) => {
          // Fetch the complete activity with user data
          const { data: newActivity } = await supabase
            .from('activities')
            .select(`
              *,
              user:profiles(id, name, email, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newActivity) {
            setActivities(prev => [newActivity, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, realtime])

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    createActivity,
  }
}