export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm border p-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Real Estate CRM
            </h1>
            <p className="text-muted-foreground mb-6">
              Professional real estate CRM for managing clients, deals, and business operations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-muted rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">Client Management</h3>
                <p className="text-sm text-muted-foreground">
                  Track clients through your sales pipeline from lead to closing.
                </p>
              </div>
              
              <div className="bg-muted rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">Financial Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor commissions, revenue, and financial performance.
                </p>
              </div>
              
              <div className="bg-muted rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">Calendar & Scheduling</h3>
                <p className="text-sm text-muted-foreground">
                  Manage appointments, deadlines, and important dates.
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a 
                href="/dashboard" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                View Dashboard
              </a>
              <div className="p-4 bg-secondary rounded-lg flex-1">
                <p className="text-sm text-secondary-foreground">
                  <strong>Project Setup Complete!</strong> Next.js 15+, TypeScript, Tailwind CSS, and all required dependencies have been installed and configured.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}