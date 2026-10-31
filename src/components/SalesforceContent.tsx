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
              <img
                src={project.image}
                alt={project.imageAlt}
                className="salesforce-project-image"
              />
            </div>

            <div className="salesforce-project-content">
              <h2 className="salesforce-project-title">
                <a href={project.url} className="salesforce-project-link">
                  {project.title}
                </a>
              </h2>
              <p className="salesforce-project-description">{project.description}</p>
              <a href={project.url} className="salesforce-project-cta" aria-hidden="true" tabIndex={-1}>
                {project.linkLabel}
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
