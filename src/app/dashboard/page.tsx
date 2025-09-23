'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import PerformanceChart from '@/components/dashboard/PerformanceChart'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { usePerformanceData } from '@/hooks/usePerformanceData'

export default function DashboardPage() {
  const { metrics, loading: metricsLoading } = useDashboardMetrics()
  const { performanceData, loading: performanceLoading, summary } = usePerformanceData()

  return (
    <DashboardLayout>
      {/* Performance Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2 space-y-2 lg:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900">Performance Snapshot</h2>
          <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm w-full lg:w-auto">
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Daily</option>
          </select>
        </div>
        <p className="text-gray-600 text-sm">Track your deals, savings, and activity at a glance.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Active Properties */}
        <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
                <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Properties</h3>
          <div className="flex items-end space-x-2">
            <span className="text-2xl font-bold text-gray-900">4</span>
            <span className="text-xs text-green-600 font-medium">+5.2%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">vs last month</p>
        </div>

        {/* Total Commission */}
        <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                <path d="M12 18V6"/>
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Commission</h3>
          <div className="flex items-end space-x-2">
            <span className="text-2xl font-bold text-gray-900">$49K</span>
            <span className="text-xs text-red-600 font-medium">-1.8%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">vs last month</p>
        </div>

        {/* Tasks Due Today */}
        <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M14 4.1 12 6"/>
                <path d="m5.1 8-2.9-.8"/>
                <path d="m6 12-1.9 2"/>
                <path d="M7.2 2.2 8 5.1"/>
                <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/>
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Tasks Due Today</h3>
          <div className="flex items-end space-x-2">
            <span className="text-2xl font-bold text-gray-900">4</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Events and deadlines scheduled</p>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                <path d="M18 20a6 6 0 0 0-12 0"/>
                <circle cx="12" cy="10" r="4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Recent Leads</h3>
          <div className="flex items-end space-x-2">
            <span className="text-2xl font-bold text-gray-900">6</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">New leads this week</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-200 mb-6 lg:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Overview</h3>
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-2 lg:space-y-0 text-sm">
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">Transactions Created</span>
                <span className="font-semibold">20</span>
                <span className="text-green-600 text-xs ml-2">+4.2%</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">Avg. Setup Time</span>
                <span className="font-semibold">7m 16s</span>
                <span className="text-red-600 text-xs ml-2">-0.2%</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-2 lg:space-y-0 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Transactions Created</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Avg Setup Time</span>
            </div>
          </div>
        </div>
        
        <div className="h-64 lg:h-80">
          <PerformanceChart />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">Deal closed for 123 Maple St.</p>
                <p className="text-xs text-gray-500 mt-1">Commission: $12,500 • 2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M18 20a6 6 0 0 0-12 0"/>
                  <circle cx="12" cy="10" r="4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">New lead: Sarah Johnson</p>
                <p className="text-xs text-gray-500 mt-1">Interested in downtown condos • 4 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">Showing scheduled</p>
                <p className="text-xs text-gray-500 mt-1">334 Oak River Dr. • Tomorrow 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-400">
                <path d="M18 20a6 6 0 0 0-12 0"/>
                <circle cx="12" cy="10" r="4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Add Client</span>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-400">
                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
                <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">List Property</span>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-400">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Schedule Showing</span>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-400">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
                <path d="M14 8H8"/>
                <path d="M16 12H8"/>
                <path d="M13 16H8"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Generate Report</span>
            </button>
          </div>
          
          {/* Upcoming Tasks */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Upcoming Tasks</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                  <span className="text-sm text-gray-700">Follow up with Sarah Johnson</span>
                </div>
                <span className="text-xs text-gray-500">Today</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                  <span className="text-sm text-gray-700">Prepare listing photos</span>
                </div>
                <span className="text-xs text-gray-500">Tomorrow</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
                  <span className="text-sm text-gray-700">Review contract terms</span>
                </div>
                <span className="text-xs text-gray-500">Friday</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}