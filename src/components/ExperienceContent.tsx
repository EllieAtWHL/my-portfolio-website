'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/Card';
import Modal from '@/components/Modal';

export default function ExperienceContent() {
  const [activeTab, setActiveTab] = useState('work');
  const [selectedAward, setSelectedAward] = useState(null);

  const tabs = [
    { id: 'work', label: 'Work' },
    { id: 'volunteer', label: 'Volunteer' },
    { id: 'certs', label: 'Certifications' },
    { id: 'awards', label: 'Awards' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'work':
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
      
      case 'volunteer':
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
      
      case 'certs':
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
      
      case 'awards':
        return (
          <>
            <div className="experience-grid">
              {awards.map((award, index) => (
                <Card key={index} variant="accent" padding="md" clickable onClick={() => setSelectedAward(award)}>
                  <div className="card-header">
                    {award.image && (
                      <img 
                        src={award.image} 
                        alt={award.name}
                        width={60}
                        height={60}
                        className="company-logo"
                      />
                    )}
                    <div className="company-info">
                      <h3 className="company-name">{award.name}</h3>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="role-section">
                      <p className="role-description">{award.description}</p>
                      <p className="role-date">{award.date}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <Modal
              isOpen={!!selectedAward}
              onClose={() => setSelectedAward(null)}
              title={selectedAward?.name || ''}
              image={selectedAward?.image}
              additionalImages={selectedAward?.additionalImages}
              description={selectedAward?.description}
              date={selectedAward?.date}
              additionalInfo={selectedAward?.additionalInfo}
            />
          </>
        );
      
      default:
        return null;
    }
  };

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

  const certifications = [
    {
      company: 'Salesforce',
      logo: '/img/salesforce-logo.svg',
      certs: [
        {
          name: 'Salesforce Certified JavaScript Developer',
          image: '/img/2021-03_Badge_SF-Certified_JavaScript-Developer-I_High-Res.png',
          date: 'June 2025'
        },
        {
          name: 'Salesforce Certified Sharing and Visibility Architect',
          image: '/img/Certified_Sharing-and-Visibility-Architect.png',
          date: 'January 2025'
        },
        {
          name: 'Salesforce Certified Application Architect',
          image: '/img/Certified_Application-Architect.png',
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

  const awards = [ 
    { name: 'National Apprenticeship Awards 2023', 
      description: 'London Region Highly Commended Advanced Apprentice of the Year', 
      date: 'October 2023', 
      image: '/img/Highly Commended.jpg' ,
      additionalInfo: 'This prestigious award recognises apprentices who have demonstrated exceptional commitment to their professional development and made significant contributions to their workplace. My award particularly highlighted my work towards increasing representation of women in tech. The selection process included a nomination from my apprentice mentor and a detailed application.'
    }, 
    { 
      name: 'All-Star Trailhead Ranger', 
      description: 'Achieved highest Trailhead rank through continuous learning', 
      date: 'Ongoing',
      image: '/img/trailhead-ranger-badge.png'
    }, 
  ];

  return (
    <div className="experience-container">
      <div className="experience-header">
        <h1 className="experience-title">Experience</h1>
        <div className="experience-subtitle">14+ Years of Technological Excellence</div>
      </div>
      
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content" role="tabpanel">
        {renderTabContent()}
      </div>
    </div>
  );
}
