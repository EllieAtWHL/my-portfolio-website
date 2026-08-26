import { Card } from '@/components/Card';

const workExperience = [
  {
    id: 'collinson',
    company: 'Collinson Group',
    logo: '/img/collinson.png',
    title: 'Salesforce Multi-Cloud Lead Technical Developer',
    date: 'January 2026 to present',
    description: [
      'Lead a team of developers',
      'Implemented best practice documents to provide a baseline for all code',
      'Set up a framework to ensure better logging within the Salesforce environment'
    ]
  },
  {
    id: 'lendinvest',
    company: 'LendInvest',
    logo: '/img/lendinvest.png',
    title: 'Lead Salesforce Engineer',
    date: 'October 2022 to December 2025',
    description: [
      'Lead a team of developers and administrators',
      'Implemented best practice documents to provide a baseline for all code and configuration',
      'Set up a framework to ensure better logging within the Salesforce environment'
    ]
  },
  {
    id: 'smoove',
    company: 'Smoove (formerly ULS Technology)',
    logo: '/img/smoovelogo.png',
    title: 'Senior Salesforce Developer',
    date: 'September 2021 to September 2022',
    description: [
      'Oversaw a team of three developers, ensuring appropriate story assignments',
      'Resolved issues and provided solutions quickly for team members',
      'Managed performance issues to ensure effective team delivery',
      'Architected and documented the forms framework for Experience Cloud',
      'Mentored junior team members transitioning to Salesforce',
      'Coordinated with Release Manager for consistent Production delivery',
      'Collaborated with Product team to validate and influence Product Roadmap',
      'Utilised Clayton to ensure code meets best practices and security standards'
    ]
  },
  {
    id: 'gld',
    company: 'Global Life Distribution',
    logo: '/img/gld.jpg',
    title: 'Senior Salesforce Developer',
    date: 'October 2019 to September 2021',
    description: [
      'Controlled all changes to ensure Salesforce org health',
      'Owned Salesforce Marketing Cloud, providing technical guidance',
      'Managed project to convert Sales application from Visualforce to LWCs',
      'Provided analytics on email tracking by integrating Marketing Cloud data',
      'Enriched Salesforce data via multiple API integrations',
      'Implemented automated Lead Rejection process using Platform Events',
      'Designed and built new application for Business Manager agent logging',
      'Delivered training on Lightning transition and Reporting'
    ]
  },
  {
    id: 'economist',
    company: 'The Economist Group',
    logo: '/img/economist.webp',
    title: 'Senior Salesforce Developer',
    date: 'May 2016 to October 2019',
    description: [
      'Led transition of entire Salesforce Platform from Classic to Lightning',
      'Established new delivery process with Git and DX for increased speed',
      'Reduced data loss risk by moving to criteria-based sharing',
      'Decreased case resolution time by migrating to Lightning Service Console',
      'Reduced API calls from 8 to 1 for new orders via custom Rest API',
      'Developed weekly label run functionality using schedule and batch Apex'
    ]
  },
  {
    id: 'fca',
    company: 'Financial Conduct Authority',
    logo: '/img/fca-logo.jpg',
    title: 'Salesforce Analyst',
    date: 'November 2011 to May 2016',
    description: [
      'Revolutionised small firm supervision through Online Regulatory Review',
      'Developed and delivered training to improve user effectiveness and data quality',
      'Improved caseworker productivity with new functionality using processes/flows'
    ]
  }
];

export function WorkExperienceTab() {
  return (
    <div className="experience-grid">
      {workExperience.map((job) => (
        <Card key={job.id} variant="accent" padding="md">
          <div className="card-header">
            <img
              src={job.logo}
              alt={job.company}
              width={60}
              height={60}
              className="company-logo"
            />
            <div className="company-info">
              <h3 className="company-name">{job.company}</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="role-section">
              <h4 className="role-title">{job.title}</h4>
              <p className="role-date">{job.date}</p>
              <ul className="role-description">
                {job.description.map((desc, index) => (
                  <li key={index}>{desc}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
