import { Database, Monitor, Server, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function WorkspacePage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">LOCAL DEVELOPMENT</div>
          <h1>Your workspace</h1>
          <p>A transparent view of what this foundation includes.</p>
        </div>
      </div>
      <Tabs defaultValue="appearance">
        <TabsList aria-label="Workspace settings">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="connections">Connections & capabilities</TabsTrigger>
        </TabsList>
        <TabsContent value="appearance">
          <Card className="settings-card">
            <div className="setting-row">
              <Monitor aria-hidden="true" />
              <div>
                <h2>Appearance</h2>
                <p>Switch between light and dark. Your preference is saved in this browser.</p>
              </div>
              <ThemeToggle />
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="connections">
          <Card className="settings-card">
            <div className="setting-row">
              <Server aria-hidden="true" />
              <div>
                <h2>API health</h2>
                <p>The header checks the live health endpoint. It reports API availability only.</p>
              </div>
            </div>
            <div className="setting-row">
              <Database aria-hidden="true" />
              <div>
                <h2>Database configuration</h2>
                <p>
                  Scan history reads from Neon PostgreSQL. API health is a liveness check, not a
                  database check. Follow the setup guide and run <code>npm.cmd run db:check</code>{' '}
                  locally.
                </p>
              </div>
            </div>
            <div className="setting-row">
              <ShieldCheck aria-hidden="true" />
              <div>
                <h2>Scanner status</h2>
                <p>
                  Scanning is disabled. A separate constrained worker and verified network
                  protections are required before scanning is enabled.
                </p>
              </div>
              <span className="preview-badge">Not enabled</span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
