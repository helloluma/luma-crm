import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test database configuration
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'http://localhost:54321';
const TEST_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key';

export const testSupabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);

// Test data cleanup and setup
export const setupIntegrationTest = () => {
  beforeAll(async () => {
    // Setup test database schema if needed
    console.log('Setting up integration test database...');
  });

  afterAll(async () => {
    // Cleanup after all tests
    console.log('Cleaning up integration test database...');
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await cleanupTestData();
  });

  afterEach(async () => {
    // Additional cleanup after each test if needed
  });
};

export const cleanupTestData = async () => {
  try {
    // Clean up test data in reverse dependency order
    await testSupabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await testSupabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await testSupabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await testSupabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await testSupabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await testSupabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await testSupabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (error) {
    console.warn('Error cleaning up test data:', error);
  }
};

// Test user creation helper
export const createTestUser = async (userData: {
  email: string;
  name: string;
  role?: 'SuperAdmin' | 'Admin' | 'Assistant';
}) => {
  const { data: authData, error: authError } = await testSupabase.auth.signUp({
    email: userData.email,
    password: 'test-password-123',
  });

  if (authError) throw authError;

  const { data: profile, error: profileError } = await testSupabase
    .from('profiles')
    .insert({
      id: authData.user?.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'Assistant',
    })
    .select()
    .single();

  if (profileError) throw profileError;

  return { user: authData.user, profile };
};

// Test client creation helper
export const createTestClient = async (clientData: {
  name: string;
  email: string;
  phone?: string;
  type?: 'Lead' | 'Prospect' | 'Client' | 'Closed';
  assigned_agent: string;
}) => {
  const { data, error } = await testSupabase
    .from('clients')
    .insert({
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      type: clientData.type || 'Lead',
      assigned_agent: clientData.assigned_agent,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Test transaction creation helper
export const createTestTransaction = async (transactionData: {
  address: string;
  client_id: string;
  price: number;
  commission_rate: number;
  status?: 'Active' | 'Pending' | 'Closed';
}) => {
  const { data, error } = await testSupabase
    .from('transactions')
    .insert({
      address: transactionData.address,
      client_id: transactionData.client_id,
      price: transactionData.price,
      commission_rate: transactionData.commission_rate,
      status: transactionData.status || 'Active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Test appointment creation helper
export const createTestAppointment = async (appointmentData: {
  title: string;
  client_id: string;
  start_time: string;
  end_time: string;
  created_by: string;
  type?: 'Showing' | 'Meeting' | 'Call' | 'Deadline';
}) => {
  const { data, error } = await testSupabase
    .from('appointments')
    .insert({
      title: appointmentData.title,
      client_id: appointmentData.client_id,
      start_time: appointmentData.start_time,
      end_time: appointmentData.end_time,
      created_by: appointmentData.created_by,
      type: appointmentData.type || 'Meeting',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Authentication helper for tests
export const authenticateTestUser = async (email: string, password: string = 'test-password-123') => {
  const { data, error } = await testSupabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// Sign out helper
export const signOutTestUser = async () => {
  await testSupabase.auth.signOut();
};

// Mock Next.js request/response for API testing
export const createMockRequest = (method: string, body?: any, headers?: Record<string, string>) => {
  return {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    json: async () => body,
  } as any;
};

export const createMockResponse = () => {
  const response = {
    status: 200,
    headers: new Map(),
    body: null,
    json: function(data: any) {
      this.body = data;
      this.headers.set('content-type', 'application/json');
      return this;
    },
    status: function(code: number) {
      this.status = code;
      return this;
    },
  };

  return response as any;
};