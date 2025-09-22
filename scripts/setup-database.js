#!/usr/bin/env node

/**
 * Database setup script for Real Estate CRM
 * This script helps set up the database schema and seed data for development
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(filePath) {
  console.log(`📄 Running migration: ${path.basename(filePath)}`)
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8')
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error(`❌ Error in ${path.basename(filePath)}:`, error.message)
      return false
    }
    
    console.log(`✅ Successfully ran ${path.basename(filePath)}`)
    return true
  } catch (err) {
    console.error(`❌ Failed to read ${filePath}:`, err.message)
    return false
  }
}

async function runSeedData() {
  console.log('🌱 Running seed data...')
  
  try {
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql')
    const sql = fs.readFileSync(seedPath, 'utf8')
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('❌ Error running seed data:', error.message)
      return false
    }
    
    console.log('✅ Successfully ran seed data')
    return true
  } catch (err) {
    console.error('❌ Failed to run seed data:', err.message)
    return false
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up Real Estate CRM database...\n')
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Migrations directory not found: ${migrationsDir}`)
    process.exit(1)
  }
  
  // Get all migration files and sort them
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
  
  if (migrationFiles.length === 0) {
    console.error('❌ No migration files found')
    process.exit(1)
  }
  
  console.log(`Found ${migrationFiles.length} migration files\n`)
  
  // Run migrations in order
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file)
    const success = await runMigration(filePath)
    
    if (!success) {
      console.error('\n❌ Migration failed. Stopping setup.')
      process.exit(1)
    }
  }
  
  console.log('\n📊 All migrations completed successfully!')
  
  // Ask if user wants to run seed data
  const args = process.argv.slice(2)
  if (args.includes('--seed')) {
    console.log('\n🌱 Running seed data...')
    await runSeedData()
  } else {
    console.log('\n💡 To add sample data, run: npm run db:seed')
  }
  
  console.log('\n✅ Database setup complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Update your .env.local with your Supabase credentials')
  console.log('   2. Run: npm run dev')
  console.log('   3. Visit: http://localhost:3000')
}

// Handle command line arguments
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log('Real Estate CRM Database Setup')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/setup-database.js [options]')
  console.log('')
  console.log('Options:')
  console.log('  --seed    Run seed data after migrations')
  console.log('  --help    Show this help message')
  process.exit(0)
}

// Run the setup
setupDatabase().catch(err => {
  console.error('❌ Setup failed:', err.message)
  process.exit(1)
})