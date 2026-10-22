import { useState } from 'react';
import { Focus, ScanLine, Image, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { FindingCard } from '@/components/finding-card';
import { CodePanel } from '@/components/code-panel';
import { Disclosure } from '@/components/disclosure';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MotionPanel } from '@/lib/motion';

const examples = [
  {
    id: 'image',
    title: 'Image alternatives',
    rule: 'image-alt',
    severity: 'critical',
    heading: 'Give every image a purpose.',
    description: 'A useful alternative helps someone understand an image without seeing it.',
    before: '<img src="collection.jpg" />',
    after: '<img src="collection.jpg"\n  alt="Canvas tote in natural cotton" />',
    reference: 'WCAG 1.1.1 · Non-text Content',
    element: 'img.collection-cover',
  },
  {
    id: 'button',
    title: 'Button names',
    rule: 'button-name',
    severity: 'critical',
    heading: 'Make the action clear.',
    description: 'An accessible name tells someone what an icon-only button will do.',
    before: '<button><BagIcon /></button>',
    after: '<button aria-label="Open shopping bag">\n  <BagIcon />\n</button>',
    reference: 'WCAG 4.1.2 · Name, Role, Value',
    element: 'button.shopping-bag',
  },
  {
    id: 'link',
    title: 'Link purpose',
    rule: 'link-name',
    severity: 'serious',
    heading: 'Give the destination context.',
    description:
      'Descriptive link text helps people decide where to go, even outside the surrounding paragraph.',
    before: '<a href="/collection"><ArrowIcon /></a>',
    after: '<a href="/collection">\n  Explore the collection\n</a>',
    reference: 'WCAG 2.4.4 · Link Purpose',
    element: 'a.collection-link',
  },
] as const;

export function ProductPreview() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected]!;
  return (
    <figure className="product-figure" id="product" tabIndex={-1} aria-labelledby="product-caption">
      <div className="product-window">
        <div className="product-window-bar">
          <span>
            <ScanLine size={17} aria-hidden="true" />
            <strong>Audit inspector</strong>
          </span>
          <span className="example-label">Illustrative preview</span>
        </div>
        <div className="product-toolbar">
          <code>example.test / collection</code>
          <div
            className="preview-summary"
            aria-label="Illustrative results: three findings, two critical and one serious"
          >
            <div>
              <strong>3</strong>
              <span>Example findings</span>
            </div>
            <div>
              <span className="summary-severity critical" />
              <strong>2</strong>
              <span>Critical</span>
            </div>
            <div>
              <span className="summary-severity serious" />
              <strong>1</strong>
              <span>Serious</span>
            </div>
          </div>
        </div>
        <div className="product-layout">
          <div className="preview-findings">
            <span className="preview-list-title">FINDINGS</span>
            <div className="preview-options" role="group" aria-label="Example accessibility checks">
              {examples.map((item, index) => (
                <FindingCard
                  key={item.id}
                  title={item.title}
                  rule={item.rule}
                  severity={item.severity}
                  selected={selected === index}
                  onSelect={() => setSelected(index)}
                />
              ))}
            </div>
          </div>
          <div className="preview-inspector">
            <MotionPanel key={example.id} className="inspector-grid">
              <div className="inspector-context">
                <div className="inspector-detail" aria-live="polite" aria-atomic="true">
                  <span className="marketing-eyebrow">SELECTED FINDING</span>
                  <h2>{example.heading}</h2>
                  <p>{example.description}</p>
                </div>
                <p className="example-reference">{example.reference}</p>
                <Disclosure title="Why this matters">
                  <p>
                    {example.description} Review the suggested fix, then test the change in context.
                  </p>
                </Disclosure>
              </div>
              <Tabs
                className="inspector-tabs"
                defaultValue="element"
                aria-label="Example finding details"
              >
                <TabsList aria-label="Example inspector views">
                  <TabsTrigger value="element">Element</TabsTrigger>
                  <TabsTrigger value="fix">Suggested fix</TabsTrigger>
                </TabsList>
                <TabsContent value="element">
                  <div className="highlighted-element">
                    <span>
                      <Focus size={15} aria-hidden="true" /> Affected element
                    </span>
                    <code>{example.element}</code>
                    <div
                      className="element-canvas"
                      aria-label={`Illustrative page with ${example.title.toLowerCase()} highlighted`}
                    >
                      <div className="element-canvas-toolbar">
                        <strong>Collection</strong>
                        <span className={example.id === 'button' ? 'element-target' : ''}>
                          <ShoppingBag size={15} aria-hidden="true" />
                        </span>
                      </div>
                      <div className="element-canvas-body">
                        <span
                          className={
                            example.id === 'image' ? 'canvas-image element-target' : 'canvas-image'
                          }
                        >
                          <Image size={24} aria-hidden="true" />
                          <span>Collection image</span>
                        </span>
                        <span
                          className={
                            example.id === 'link' ? 'canvas-link element-target' : 'canvas-link'
                          }
                        >
                          Explore collection <ArrowUpRight size={14} aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                    <code className="affected-markup">{example.before}</code>
                  </div>
                </TabsContent>
                <TabsContent value="fix">
                  <CodePanel label="Original markup" code={example.before} />
                  <CodePanel label="Suggested direction" code={example.after} improved copy />
                  <p className="example-code-note">
                    Illustrative guidance. Review fixes in context.
                  </p>
                </TabsContent>
              </Tabs>
            </MotionPanel>
          </div>
        </div>
        <div className="product-window-footer">
          <span className="signal-dot" /> Example content. No website has been scanned.
        </div>
      </div>
      <figcaption id="product-caption">
        Interactive product concept · Example content, not live scan results.
      </figcaption>
    </figure>
  );
}
