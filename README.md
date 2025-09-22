# Real Estate CRM

A modern, professional real estate CRM web application built with Next.js 15+, TypeScript, and Tailwind CSS.

## Features

- **Client Management**: Track clients through your sales pipeline from lead to closing
- **Financial Tracking**: Monitor commissions, revenue, and financial performance  
- **Calendar & Scheduling**: Manage appointments, deadlines, and important dates
- **Document Management**: Secure file storage and organization
- **Notifications**: Email and SMS alerts for important events
- **Analytics**: Comprehensive dashboard with performance metrics

## Tech Stack

- **Frontend**: Next.js 15+ with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password and OAuth
- **UI Components**: Custom components based on Luma templates
- **Icons**: Lucide React
- **Charts**: Chart.js with react-chartjs-2
- **Data Fetching**: SWR
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── calendar/       # Calendar and scheduling
│   ├── clients/        # Client management
│   ├── dashboard/      # Dashboard components
│   ├── financial/      # Financial tracking
│   ├── layout/         # Layout components
│   ├── notifications/  # Notification system
│   └── ui/            # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries (Supabase, etc.)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Development

This project follows the spec-driven development methodology. See the `.kiro/specs/real-estate-crm/` directory for:

- `requirements.md` - Feature requirements
- `design.md` - Technical design document  
- `tasks.md` - Implementation task list

## License

Private project - All rights reserved