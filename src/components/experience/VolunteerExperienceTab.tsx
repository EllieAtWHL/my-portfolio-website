import { Card } from '@/components/Card';

const volunteerExperience = [
  {
    id: 'champion',
    company: 'Salesforce',
    logo: '/img/salesforce-logo.svg',
    roles: [
      {
        title: 'Salesforce Community Advisory Board Member',
        date: 'July 2025 to present',
        description: ['Providing feedback and guidance to Salesforce on community features and improvements']
      },
      {
        title: 'Trailblazer Community Group Leader for London Developer User Group',
        date: 'October 2024 to present',
        description: ['Working alongside co-leads to organise venues, sponsors and speakers for monthly events']
      },
      {
        title: 'Credential SME',
        date: 'January 2024 to present',
        description: ['Beta Tester for Superbadges', 'SME for Certifications']
      },
      {
        title: 'Lightning/Platform Champion',
        date: 'January 2020 - July 2021',
        description: [
          'Wrote blog posts guiding users through Classic to Lightning transition',
          'Provided Salesforce Platform Quick Tips with published videos',
          'Participated in early feature viewing and provided UX feedback'
        ]
      }
    ]
  },
  {
    id: 'radWomen',
    company: 'RAD Women',
    logo: '/img/RADWomen.png',
    roles: [
      {
        title: 'Salesforce Trainer',
        date: 'October 2023 to present',
        description: [
          'Training Salesforce admins on introduction to Salesforce development',
          'Reviewing and commenting on homework completed by trainees'
        ]
      }
    ]
  },
  {
    id: 'pspa',
    company: 'PSPA',
    logo: '/img/pspa.png',
    roles: [
      {
        title: 'Salesforce Developer',
        date: 'September 2023 - Present',
        description: ['Converting Visualforce page to LWC']
      }
    ]
  }
];

export function VolunteerExperienceTab() {
  return (
    <div className="experience-grid">
      {volunteerExperience.map((vol) => (
        <Card key={vol.id} variant="accent" padding="md">
          <div className="card-header">
            <img
              src={vol.logo}
              alt={vol.company}
              width={60}
              height={60}
              className="company-logo"
            />
            <div className="company-info">
              <h3 className="company-name">{vol.company}</h3>
            </div>
          </div>
          <div className="card-content">
            {vol.roles.map((role, index) => (
              <div key={index} className="role-section">
                <h4 className="role-title">{role.title}</h4>
                <p className="role-date">{role.date}</p>
                <ul className="role-description">
                  {role.description.map((desc, descIndex) => (
                    <li key={descIndex}>{desc}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
