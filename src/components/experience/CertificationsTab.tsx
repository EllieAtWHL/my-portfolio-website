import { Card } from '@/components/Card';

const certifications = [
  {
    company: 'Salesforce',
    logo: '/img/salesforce-logo.svg',
    certs: [
      {
        name: 'Salesforce Certified Platform Development Lifecycle and Deployment Architect',
        image: '/img/2025-04_Badge_SF-Certified_Plat-Dev-LC-Dep-Arch_High-Res.png',
        date: 'July 2026'
      },
      {
        name: 'Salesforce Certified JavaScript Developer',
        image: '/img/2021-03_Badge_SF-Certified_JavaScript-Developer-I_High-Res.png',
        date: 'June 2025'
      },
      {
        name: 'Salesforce Certified Application Architect',
        image: '/img/Certified_Application-Architect.png',
        date: 'January 2025'
      },
      {
        name: 'Salesforce Certified Sharing and Visibility Architect',
        image: '/img/Certified_Sharing-and-Visibility-Architect.png',
        date: 'January 2025'
      },
      {
        name: 'Salesforce Certified AI Associate',
        image: '/img/2023-07_Badge_SF-Certified_AI-Associate_High-Res.png',
        date: 'October 2024'
      },
      {
        name: 'Salesforce Certified Data Architect',
        image: '/img/Data Architect.png',
        date: 'July 2023'
      },
      {
        name: 'Salesforce Certified Platform App Builder',
        image: '/img/Platform-App-Builder.png',
        date: 'May 2023'
      },
      {
        name: 'Salesforce Certified Platform Developer II',
        image: '/img/SF-Certified_Platform-Developer-II.png',
        date: 'February 2020'
      },
      {
        name: 'Salesforce Certified Marketing Cloud Email Specialist',
        image: '/img/SF-Certified_Marketing-Cloud-Email-Specialist.png',
        date: 'November 2018'
      },
      {
        name: 'Salesforce Certified Platform Developer I',
        image: '/img/SF-Certified_Platform-Developer-I.png',
        date: 'November 2017'
      },
      {
        name: 'Salesforce Certified Advanced Administrator',
        image: '/img/SF-Certified_Advanced-Administrator.png',
        date: 'December 2015'
      },
      {
        name: 'Salesforce Certified Administrator',
        image: '/img/SF-Certified_Administrator.png',
        date: 'April 2014'
      }
    ]
  },
  {
    company: 'Datadog',
    logo: '/img/datadog.avif',
    certs: [
      {
        name: 'Datadog Certified: Log Management Fundamentals',
        image: '/img/datadogCert.png',
        date: 'April 2025'
      }
    ]
  },
  {
    company: 'CMI',
    logo: '/img/cmi-ds.png',
    certs: [
      {
        name: 'Level 3 Team Leader/Supervisor Apprenticeship - Distinction',
        image: '/img/cmi-logo-colour-compact.svg',
        date: 'December 2023'
      }
    ]
  },
  {
    company: 'Agile PM',
    logo: '/img/AgilePM-logo.png',
    certs: [
      {
        name: 'Agile PM Foundation',
        image: '/img/Agile_Project_Management_Foundation__600PX.png',
        date: 'March 2019'
      }
    ]
  }
];

export function CertificationsTab() {
  return (
    <div className="experience-grid">
      {certifications.map((certGroup, index) => (
        <Card key={index} variant="accent" padding="md">
          <div className="card-header">
            <img
              src={certGroup.logo}
              alt={certGroup.company}
              width={60}
              height={60}
              className="company-logo"
            />
            <div className="company-info">
              <h3 className="company-name">{certGroup.company}</h3>
            </div>
          </div>
          <div className="card-content">
            {certGroup.certs.map((cert, certIndex) => (
              <div key={certIndex} className="role-section">
                <div className="cert-flex-container">
                  <img
                    src={cert.image}
                    alt={cert.name}
                    width={40}
                    height={40}
                    className="cert-logo"
                  />
                  <div>
                    <h4 className="role-title">{cert.name}</h4>
                    <p className="role-date">{cert.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
