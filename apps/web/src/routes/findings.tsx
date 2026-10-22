import { Braces, Focus, ListFilter } from 'lucide-react';
import { Link } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/empty-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function FindingsPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">EVIDENCE, WITH CONTEXT</div>
          <h1>Findings explorer</h1>
          <p>Move from a finding to its element and a considered fix.</p>
        </div>
      </div>
      <Tabs defaultValue="findings">
        <TabsList aria-label="Findings views">
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="element">Element inspection</TabsTrigger>
          <TabsTrigger value="fixes">Fix suggestions</TabsTrigger>
        </TabsList>
        <TabsContent value="findings">
          <Card>
            <EmptyState headingLevel={2} icon={ListFilter} title="No findings to explore">
              Once real audits are available, you’ll review findings by rule and severity here. This
              preview contains no scan data.
            </EmptyState>
            <div className="center-action">
              <Button asChild variant="outline">
                <Link to="/app/new">View the new scan layout</Link>
              </Button>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="element">
          <Card>
            <EmptyState headingLevel={2} icon={Focus} title="An element needs a real finding">
              Visual highlights and affected markup will appear here after you select a finding from
              an audit. Inspection is not enabled yet.
            </EmptyState>
          </Card>
        </TabsContent>
        <TabsContent value="fixes">
          <Card>
            <EmptyState headingLevel={2} icon={Braces} title="Guidance starts with context">
              Future suggestions will explain the barrier and show a possible fix. No code has been
              generated or applied.
            </EmptyState>
          </Card>
        </TabsContent>
      </Tabs>
      <p className="page-note">
        Want to try the interaction?{' '}
        <Link to="/#product" className="text-link">
          Explore the illustrative public inspector
        </Link>
        .
      </p>
    </div>
  );
}
