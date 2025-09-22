export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Test Admin',
    role: 'Admin'
  },
  agent: {
    email: 'agent@test.com',
    password: 'agent123',
    name: 'Test Agent',
    role: 'Assistant'
  },
  superAdmin: {
    email: 'superadmin@test.com',
    password: 'super123',
    name: 'Super Admin',
    role: 'SuperAdmin'
  }
};

export const testClients = {
  lead: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    type: 'Lead',
    source: 'Website',
    budgetMin: 300000,
    budgetMax: 500000,
    preferredArea: 'Downtown',
    notes: 'Looking for a 2-bedroom condo'
  },
  prospect: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1987654321',
    type: 'Prospect',
    source: 'Referral',
    budgetMin: 500000,
    budgetMax: 750000,
    preferredArea: 'Suburbs',
    notes: 'Interested in family homes'
  },
  client: {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    phone: '+1122334455',
    type: 'Client',
    source: 'Cold Call',
    budgetMin: 200000,
    budgetMax: 350000,
    preferredArea: 'City Center',
    notes: 'First-time buyer'
  }
};

export const testTransactions = {
  active: {
    address: '123 Main St, Anytown, ST 12345',
    price: 450000,
    commissionRate: 3.0,
    status: 'Active',
    closingDate: '2024-06-15'
  },
  pending: {
    address: '456 Oak Ave, Somewhere, ST 67890',
    price: 325000,
    commissionRate: 2.5,
    status: 'Pending',
    closingDate: '2024-05-20'
  },
  closed: {
    address: '789 Pine Rd, Elsewhere, ST 11111',
    price: 275000,
    commissionRate: 3.5,
    status: 'Closed',
    closingDate: '2024-03-10'
  }
};

export const testAppointments = {
  showing: {
    title: 'Property Showing',
    description: 'Show 123 Main St to potential buyers',
    type: 'Showing',
    startTime: '2024-04-15T14:00:00Z',
    endTime: '2024-04-15T15:00:00Z',
    location: '123 Main St, Anytown, ST 12345'
  },
  meeting: {
    title: 'Client Meeting',
    description: 'Discuss contract terms',
    type: 'Meeting',
    startTime: '2024-04-16T10:00:00Z',
    endTime: '2024-04-16T11:00:00Z',
    location: 'Office Conference Room'
  },
  deadline: {
    title: 'Contract Deadline',
    description: 'Final contract submission deadline',
    type: 'Deadline',
    startTime: '2024-04-20T17:00:00Z',
    endTime: '2024-04-20T17:00:00Z',
    location: 'N/A'
  }
};

export const testDocuments = {
  contract: {
    filename: 'purchase-contract.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024000
  },
  disclosure: {
    filename: 'property-disclosure.pdf',
    mimeType: 'application/pdf',
    fileSize: 512000
  },
  inspection: {
    filename: 'inspection-report.pdf',
    mimeType: 'application/pdf',
    fileSize: 2048000
  }
};

export const testNotifications = {
  deadline: {
    title: 'Deadline Approaching',
    message: 'Contract deadline is in 2 days',
    type: 'warning'
  },
  newClient: {
    title: 'New Client Added',
    message: 'John Doe has been added as a new lead',
    type: 'info'
  },
  transactionClosed: {
    title: 'Transaction Closed',
    message: 'Property at 789 Pine Rd has been successfully closed',
    type: 'success'
  }
};

export const mockApiResponses = {
  dashboardMetrics: {
    activeClients: 15,
    pendingDeals: 8,
    monthlyRevenue: 45000,
    totalCommissions: 135000,
    conversionRate: 0.65,
    averageDealSize: 425000
  },
  revenueAnalytics: {
    monthlyRevenue: [
      { month: 'Jan', revenue: 35000 },
      { month: 'Feb', revenue: 42000 },
      { month: 'Mar', revenue: 38000 },
      { month: 'Apr', revenue: 45000 }
    ],
    yearlyGoal: 500000,
    currentProgress: 160000
  },
  activityFeed: [
    {
      id: '1',
      type: 'client_added',
      message: 'New client John Doe added',
      timestamp: '2024-04-15T10:30:00Z'
    },
    {
      id: '2',
      type: 'transaction_updated',
      message: 'Transaction at 123 Main St updated',
      timestamp: '2024-04-15T09:15:00Z'
    }
  ]
};