'use client'

import { useState } from 'react'
import { ClientList } from '@/components/clients'
import type { ClientWithAgent } from '@/types'

export default function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<ClientWithAgent | null>(null)

  const handleClientEdit = (client: ClientWithAgent) => {
    console.log('Edit client:', client)
    // TODO: Open edit modal/form
  }

  const handleClientDelete = (client: ClientWithAgent) => {
    console.log('Delete client:', client)
    // TODO: Show confirmation dialog and delete
  }

  const handleClientView = (client: ClientWithAgent) => {
    console.log('View client:', client)
    setSelectedClient(client)
    // TODO: Open client details modal/page
  }

  const handleClientCreate = () => {
    console.log('Create new client')
    // TODO: Open create client modal/form
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientList
          onClientEdit={handleClientEdit}
          onClientDelete={handleClientDelete}
          onClientView={handleClientView}
          onClientCreate={handleClientCreate}
        />
        
        {/* Debug info */}
        {selectedClient && (
          <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Selected Client (Debug)</h3>
            <pre className="text-sm text-gray-600 overflow-auto">
              {JSON.stringify(selectedClient, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}