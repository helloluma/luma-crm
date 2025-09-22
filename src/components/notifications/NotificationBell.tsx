'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useUnreadNotificationsCount } from '@/hooks/useNotifications'
import { NotificationCenter } from './NotificationCenter'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { count } = useUnreadNotificationsCount()

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <NotificationCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}