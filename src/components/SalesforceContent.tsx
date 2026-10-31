import Image from 'next/image';
import { Card } from '@/components/Card';

// The Free and Trial Orgs page (/salesforce/free-and-trial-orgs) is
// deliberately left out, matching ProjectsContent: it needs some work, so it
// stays reachable by URL without being linked from here.
const salesforceProjects = [
  {
    id: 'lightning-rollout',
    title: 'Lightning Rollout',
    description: 'A 3-part guide to migrating from Salesforce Classic to Lightning, from business buy-in to post-migration adoption.',
    image: '/salesforce/lightning-rollout/lightning.jpeg',
    imageAlt: 'Lightning strike',
    url: '/salesforce/lightning-rollout',
    linkLabel: 'Read the series →'
  },
  {
    id: 'fantasy-football-draft',
    title: 'Fantasy Football Draft Application',
    description: 'How I used Salesforce to build a live draft application for our Fantasy Football league.',
    image: '/salesforce/fantasy-football-draft/GHLdataModel.png',
    imageAlt: 'Data model of the draft application',
    url: '/salesforce/fantasy-football-draft',
    linkLabel: 'See how it works →'
  }
];

export default function SalesforceContent() {
  return (
    <div className="salesforce-container">
      <div className="page-header">
        <h1 className="page-title-solid">Salesforce</h1>
        <p className="page-subtitle">Salesforce projects, guides and applications</p>
      </div>

      <div className="salesforce-projects-grid">
        {salesforceProjects.map((project) => (
          <Card key={project.id} variant="accent" padding="sm" className="salesforce-project-card">
            <div className="salesforce-project-image-container">
              <Image
                src={project.image}
                alt={project.imageAlt}
                fill
                sizes="(min-width: 768px) 560px, 100vw"
                className="salesforce-project-image"
              />
            </div>

            <div className="salesforce-project-content">
              {/* The title link stretches over the whole card (see salesforce.css),
                  so the card has one link and the call to action below is text. */}
              <h2 className="salesforce-project-title">
                <a href={project.url} className="salesforce-project-link">
                  {project.title}
                </a>
              </h2>
              <p className="salesforce-project-description">{project.description}</p>
              <span className="salesforce-project-cta">{project.linkLabel}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
