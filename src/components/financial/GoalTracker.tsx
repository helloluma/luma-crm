'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { GoalData, RevenueData } from './RevenueAnalytics'
import { 
  Target, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

interface GoalTrackerProps {
  goals: GoalData[]
  revenueData: RevenueData
  className?: string
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ 
  goals, 
  revenueData, 
  className = '' 
}) => {
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)

  const getGoalIcon = (type: GoalData['type']) => {
    switch (type) {
      case 'revenue':
        return DollarSign
      case 'deals':
        return Target
      case 'commission':
        return TrendingUp
      default:
        return Target
    }
  }

  const getGoalStatus = (goal: GoalData) => {
    const progress = (goal.current / goal.target) * 100
    const deadline = new Date(goal.deadline)
    const now = new Date()
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (progress >= 100) {
      return { status: 'completed', color: 'green', icon: CheckCircle }
    } else if (daysLeft < 30 && progress < 75) {
      return { status: 'at-risk', color: 'red', icon: AlertCircle }
    } else if (daysLeft < 60 && progress < 50) {
      return { status: 'behind', color: 'yellow', icon: Clock }
    } else {
      return { status: 'on-track', color: 'blue', icon: Target }
    }
  }

  const formatValue = (value: number, type: GoalData['type']) => {
    switch (type) {
      case 'revenue':
      case 'commission':
        return `$${value.toLocaleString()}`
      case 'deals':
        return value.toString()
      default:
        return value.toString()
    }
  }

  const getStatusColor = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Goal Tracking</h3>
          <p className="text-sm text-gray-600">Monitor your progress towards key objectives</p>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Goal
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100)
          const status = getGoalStatus(goal)
          const Icon = getGoalIcon(goal.type)
          const StatusIcon = status.icon
          const deadline = new Date(goal.deadline)
          const daysLeft = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

          return (
            <Card key={goal.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Due {deadline.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status.color)}`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.status.replace('-', ' ')}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingGoal(goal.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {formatValue(goal.current, goal.type)} / {formatValue(goal.target, goal.type)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      status.color === 'green' ? 'bg-green-500' :
                      status.color === 'red' ? 'bg-red-500' :
                      status.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{progress.toFixed(1)}% complete</span>
                  <span>
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                  </span>
                </div>
              </div>

              {/* Insights */}
              {goal.type === 'revenue' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Monthly Avg Needed</p>
                      <p className="font-medium text-gray-900">
                        ${Math.ceil((goal.target - goal.current) / Math.max(daysLeft / 30, 1)).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Current Pace</p>
                      <p className={`font-medium ${
                        progress >= (100 - (daysLeft / 365) * 100) ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {progress >= (100 - (daysLeft / 365) * 100) ? 'On Track' : 'Behind'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Goal Summary</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {goals.filter(g => getGoalStatus(g).status === 'completed').length}
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {goals.filter(g => getGoalStatus(g).status === 'on-track').length}
            </div>
            <p className="text-sm text-gray-600">On Track</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {goals.filter(g => getGoalStatus(g).status === 'behind').length}
            </div>
            <p className="text-sm text-gray-600">Behind</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {goals.filter(g => getGoalStatus(g).status === 'at-risk').length}
            </div>
            <p className="text-sm text-gray-600">At Risk</p>
          </div>
        </div>
      </Card>

      {/* Add Goal Modal (simplified for now) */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Goal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Goal creation functionality would be implemented here with a proper form.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddGoal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddGoal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Goal
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default GoalTracker