'use client'

import { NotificationType } from '@/types'

interface NotificationFiltersProps {
  selectedType?: NotificationType
  onTypeChange: (type?: NotificationType) => void
}

const notificationTypes: { value: NotificationType; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
]

export function NotificationFilters({ selectedType, onTypeChange }: NotificationFiltersProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <div className="mt-1">
          <select
            value={selectedType || ''}
            onChange={(e) => onTypeChange(e.target.value as NotificationType || undefined)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All types</option>
            {notificationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}