'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';

export default function ProjectsContent() {
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  /*
    Comenting this out for now as the page needs some work. 
    The url is still available but at least I am not directing people to it.
        {
          id: 'sf-org',
          title: 'Salesforce Free and Trial Orgs',
          url: '/salesforce-orgs',
          isExternal: false
        },
  */

  const projectCategories = [
    {
      id: 'salesforce',
      title: 'Salesforce',
      image: '/img/salesforce.png',
      description: 'Salesforce projects and applications.',
      links: [
        {
          id: 'lightning',
          title: 'Lightning Rollout',
          url: '/lightning-rollout',
          isExternal: false
        },
        {
          id: 'ghl',
          title: 'Fantasy Football Draft Application',
          url: '/ghl',
          isExternal: false
        },
        {
          id: 'quick-tips-1',
          title: 'Quick Tips: Access Popular Items in a Single Click',
          url: 'https://www.youtube.com/watch?v=CfDqOJrnVmc',
          isExternal: true
        },
        {
          id: 'quick-tips-2',
          title: 'Quick Tips: Make Key Information Easier to Find',
          url: 'https://www.youtube.com/watch?v=GWoZodkICew',
          isExternal: true
        },
        {
          id: 'equality-diversity',
          title: 'Equality, Diversity & Inclusion in the Salesforce Community',
          url: 'https://www.youtube.com/watch?v=xQCK-rN1l3E',
          isExternal: true
        },
        {
          id: 'hobbies-learning',
          title: 'Use your hobbies to fuel your Salesforce learning',
          url: 'https://gearset.com/video/use-your-hobbies-to-fuel-your-salesforce-learning/',
          isExternal: true
        }
      ]
    },
    {
      id: 'games',
      title: 'Games',
      image: '/img/games.png',
      description: 'Interactive games and coding experiments.',
      links: [
        {
          id: 'regicide',
          title: 'Regicide',
          url: '/regicide',
          isExternal: false
        },
        {
          id: 'flappy',
          title: 'Flappy McFlapface',
          url: '../flappy',
          isExternal: false
        }
      ]
    },
    {
      id: 'volunteer',
      title: 'Volunteer',
      image: '/img/vols.png',
      description: 'Volunteering experiences and community involvement.',
      links: [
        {
          id: 'london-2012',
          title: 'London 2012',
          url: '../london-2012',
          isExternal: false
        },
        {
          id: 'euro-2020',
          title: 'Euro 2020',
          url: '#',
          isExternal: false,
          isComingSoon: true
        }
      ]
    }
  ];

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1 className="projects-title">Projects</h1>
        <div className="projects-subtitle">From Salesforce development to creative coding adventures</div>
      </div>

      <div className="projects-grid">
        {projectCategories.map((category) => (
          <Card 
            key={category.id} 
            variant="accent" 
            padding="sm"
            className="project-card"
          >
            <div className="card-header" onClick={() => toggleCard(category.id)}>
              <img 
                src={category.image} 
                alt={category.title}
                className="category-image"
              />
              <h2 className="card-title">{category.title}</h2>
              <div className="expand-icon">
                {expandedCards.includes(category.id) ? '−' : '+'}
              </div>
            </div>
            
            <p className="card-description">{category.description}</p>
            
            <div className={`links-container ${expandedCards.includes(category.id) ? 'expanded' : 'collapsed'}`}>
              <ul className="project-links">
                {category.links.map((link) => (
                  <li key={link.id} className="project-link-item">
                    {link.isComingSoon ? (
                      <span className="coming-soon">
                        {link.title} <sup><i>Coming soon</i></sup>
                      </span>
                    ) : (
                      <a 
                        href={link.url} 
                        className="project-link"
                        {...(link.isExternal && { 
                          target: '_blank', 
                          rel: 'noopener noreferrer' 
                        })}
                      >
                        {link.title}
                        {link.isExternal && (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            height="16" 
                            viewBox="0 96 960 960" 
                            width="16" 
                            className="external-link-icon"
                          >
                            <path d="M180 936q-24 0-42-18t-18-42V276q0-24 18-42t42-18h279v60H180v600h600V597h60v279q0 24-18 42t-42 18H180Zm202-219-42-43 398-398H519v-60h321v321h-60V319L382 717Z" fill="currentColor"/>
                          </svg>
                        )}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
