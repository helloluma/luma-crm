# Luma CRM User Guide

Welcome to Luma CRM - your comprehensive real estate client relationship management system. This guide will help you navigate and use all the features effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Client Management](#client-management)
4. [Journey Stages](#journey-stages)
5. [Calendar & Events](#calendar--events)
6. [Financial Management](#financial-management)
7. [Notifications](#notifications)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Tips & Best Practices](#tips--best-practices)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Logging In

1. Navigate to your Luma CRM URL
2. Enter your email address and password
3. Click "Sign In"

If you've forgotten your password, click "Forgot Password" to reset it.

### First Time Setup

After logging in for the first time:
1. Complete your profile information
2. Set up notification preferences
3. Familiarize yourself with the dashboard
4. Import any existing client data

## Dashboard Overview

The dashboard provides a quick overview of your business:

### Key Metrics Cards

- **Active Clients**: Current number of active clients
- **Under Contract**: Clients currently under contract
- **Tasks Due Today**: Urgent tasks requiring attention
- **Upcoming Deadlines**: Important dates in the next 7 days
- **YTD Financials**: Year-to-date financial summary (Admin/SuperAdmin only)

### Next Up Section

Shows your most important upcoming tasks and events, helping you prioritize your day.

### Quick Actions

Access frequently used features directly from the dashboard:
- Add new client
- Create calendar event
- Import financial data
- View notifications

## Client Management

### Adding a New Client

1. Click "Add Client" from the dashboard or navigate to Clients → "New Client"
2. Fill in the required information:
   - **Name**: Client's full name
   - **Email**: Primary email address
   - **Phone**: Contact number
   - **Address**: Property address (if applicable)
   - **Lender**: Mortgage lender information
   - **Status**: Current status (Lead, Active, Under Contract, Closed)
   - **Notes**: Additional information

3. Click "Save Client"

### Viewing Client Details

Click on any client from the client list to view their complete profile:

#### Overview Tab
- Contact information
- Current status and stage
- Recent activity
- Quick actions (Edit, Add Event, Upload Document)

#### Timeline/Stage Tab
- Visual progress through the real estate journey
- Stage history with timestamps
- Who made changes and when
- Stage-specific deadlines and alerts

#### Documents Tab
- Upload and manage client documents
- Organize by document type
- Secure file storage
- Download and share capabilities

#### Calendar Tab
- Client-specific events and appointments
- Integration with main calendar
- Schedule new events directly

### Editing Client Information

1. Open the client profile
2. Click "Edit Client"
3. Update the necessary information
4. Click "Save Changes"

### Managing Client Status

Update client status as they progress:
- **Lead**: Initial contact, potential client
- **Active**: Actively working with client
- **Under Contract**: Property under contract
- **Closed**: Transaction completed

## Journey Stages

Luma CRM tracks clients through detailed journey stages with automatic notifications and alerts.

### Stage Categories

#### High Alert Stages (Time-Critical)
These stages have strict deadlines and potential contract termination risks:
- Due Diligence Period
- Inspection Objection Deadline
- Appraisal Objection Deadline
- Loan Approval Deadline
- Contingency Removal Deadlines
- Clear to Close
- Final Walkthrough
- Closing Scheduled

#### Medium Alert Stages (Important)
Important milestones with some flexibility:
- Purchase Agreement Executed
- Earnest Money Deposited
- Title Work Ordered
- Inspection Scheduled
- HOA Documents Delivered

#### Low Alert Stages (Administrative)
Relationship building and administrative tasks:
- Lead Generated
- Initial Consultation Scheduled
- Property Search Active
- Closed
- Client Maintenance

### Updating Client Stages

1. Open the client profile
2. Go to the Timeline/Stage tab
3. Click "Update Stage"
4. Select the new stage from the dropdown
5. Add notes about the transition
6. Click "Update"

The system will automatically:
- Record the stage change with timestamp
- Send appropriate notifications
- Set up deadline alerts
- Update the visual progress tracker

### Stage Notifications

The system automatically sends notifications based on stage urgency:
- **High Priority**: In-app + Email + SMS
- **Medium Priority**: In-app + Email
- **Low Priority**: In-app only

## Calendar & Events

### Viewing Your Calendar

Navigate to the Calendar section to see:
- **Agenda View**: List of upcoming events (default on mobile)
- **Month View**: Traditional calendar layout
- **Filter Options**: View by client or priority level

### Creating Events

1. Click "Add Event" or click on a date in the calendar
2. Fill in event details:
   - **Title**: Event name
   - **Date & Time**: When the event occurs
   - **Client**: Associate with a specific client (optional)
   - **Priority**: Low, Medium, or High
   - **Description**: Additional details

3. Click "Save Event"

### Event Priority Levels

- **High**: Critical deadlines, closings, inspections
- **Medium**: Important meetings, showings
- **Low**: Follow-ups, administrative tasks

Events are color-coded by priority for easy identification.

### Client-Specific Calendar

Each client has their own calendar view showing only events related to them. Access this from the client profile's Calendar tab.

## Financial Management

*Note: Financial features are only available to Admin and SuperAdmin users.*

### Importing Financial Data

Luma CRM can import data from your Transaction Tracker spreadsheet:

1. Navigate to Financials → Import
2. Click "Upload CSV File"
3. Select your Transaction Tracker CSV file
4. Review the import preview
5. Click "Import Data"

The system will automatically:
- Parse ACTIVE, PENDING, and SOLD sections
- Calculate commissions and totals
- Create or update client records
- Display summary totals

### Viewing Financial Reports

The Financials section provides:
- **YTD Totals**: Year-to-date financial summary
- **Per-Client Breakdown**: Revenue by client
- **Transaction List**: Detailed transaction history
- **Charts & Graphs**: Visual financial data

### Financial Metrics

Key financial metrics include:
- Gross commission income
- Net commission (after broker splits)
- Active pipeline value
- Closed transaction volume
- Average commission per transaction

## Notifications

### Notification Types

- **Client Updates**: Stage changes, document uploads
- **Deadlines**: Upcoming important dates
- **System**: Application updates, maintenance
- **Financial**: Transaction updates (Admin only)

### Notification Channels

- **In-App**: Toast messages and notification center
- **Email**: Sent for medium and high priority notifications
- **SMS**: Sent only for high priority notifications

### Managing Notification Preferences

1. Navigate to Settings → Notifications
2. Configure your preferences:
   - **Email Notifications**: Enable/disable email alerts
   - **SMS Notifications**: Enable/disable SMS alerts
   - **Quiet Hours**: Set times when notifications are suppressed
   - **Daily Digest**: Receive summary emails

3. Click "Save Preferences"

### Viewing Notifications

- Click the bell icon in the header to see recent notifications
- Unread notifications show a red badge
- Click on notifications to mark as read
- Access full notification history in the notification center

## User Roles & Permissions

### Role Types

#### SuperAdmin
- Full access to all features
- User management capabilities
- System configuration
- Financial data access

#### Admin
- Access to all client features
- Financial data access
- Calendar management
- Cannot manage other users

#### Assistant
- Client management (view and edit)
- Calendar access
- No financial data access
- Limited administrative functions

### Role-Based Features

| Feature | SuperAdmin | Admin | Assistant |
|---------|------------|-------|-----------|
| Client Management | ✅ | ✅ | ✅ |
| Calendar | ✅ | ✅ | ✅ |
| Financials | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |

## Tips & Best Practices

### Client Management
- Update client stages promptly to ensure accurate notifications
- Use the notes field to record important conversations
- Upload documents immediately to keep everything organized
- Set calendar reminders for important deadlines

### Stage Management
- Pay special attention to High Alert stages
- Review stage deadlines regularly
- Use stage notes to document important decisions
- Communicate stage changes to your team

### Calendar Organization
- Use priority levels consistently
- Associate events with clients when possible
- Set reminders for critical deadlines
- Review your calendar daily

### Financial Tracking
- Import financial data regularly
- Review YTD totals monthly
- Track commission goals and progress
- Keep transaction records up to date

### Notifications
- Configure quiet hours to avoid after-hours alerts
- Use high priority sparingly for truly urgent items
- Review notification preferences regularly
- Don't ignore deadline notifications

## Troubleshooting

### Common Issues

#### Can't Log In
- Verify your email and password
- Check if Caps Lock is on
- Try the "Forgot Password" feature
- Contact your administrator

#### Missing Financial Data
- Ensure you have Admin or SuperAdmin role
- Check if data was imported correctly
- Verify CSV file format
- Contact support if issues persist

#### Notifications Not Working
- Check notification preferences
- Verify email address is correct
- Check spam/junk folders
- Ensure SMS number is correct

#### Calendar Events Not Showing
- Check date range and filters
- Verify event was saved correctly
- Try refreshing the page
- Check if event is associated with filtered client

#### Client Information Not Updating
- Ensure you clicked "Save" after editing
- Check if you have edit permissions
- Try refreshing the page
- Contact administrator if issues persist

### Getting Help

1. **Check this User Guide**: Most questions are answered here
2. **Contact Your Administrator**: For account or permission issues
3. **System Status**: Check if there are any known issues
4. **Support Team**: Contact technical support for system issues

### Browser Requirements

Luma CRM works best with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Ensure JavaScript is enabled and cookies are allowed.

## Keyboard Shortcuts

- **Ctrl/Cmd + K**: Global search
- **Ctrl/Cmd + N**: Add new client (from clients page)
- **Ctrl/Cmd + E**: Add new event (from calendar page)
- **Esc**: Close modals and dropdowns

## Mobile Usage

Luma CRM is fully responsive and works on mobile devices:
- Touch-friendly interface
- Optimized layouts for small screens
- Swipe gestures for navigation
- Mobile-specific features like click-to-call

## Data Security

Your data is protected by:
- SSL encryption for all communications
- Secure authentication
- Regular backups
- Role-based access control
- Audit logging of all changes

## Updates and New Features

Luma CRM is regularly updated with new features and improvements:
- Updates are applied automatically
- New features are announced via notifications
- Training materials are updated as needed
- Feedback is welcome for future enhancements

---

*For additional support or questions not covered in this guide, please contact your system administrator or the Luma CRM support team.*