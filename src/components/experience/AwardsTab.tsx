'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import Modal from '@/components/Modal';

interface Award {
  name: string;
  description: string;
  date: string;
  image: string;
  additionalInfo?: string;
  additionalImages?: string[];
}

const awards: Award[] = [
  {
    name: 'National Apprenticeship Awards 2023',
    description: 'London Region Highly Commended Advanced Apprentice of the Year',
    date: 'October 2023',
    image: '/img/Highly Commended.jpg',
    additionalInfo: 'This prestigious award recognises apprentices who have demonstrated exceptional commitment to their professional development and made significant contributions to their workplace. My award particularly highlighted my work towards increasing representation of women in tech. The selection process included a nomination from my apprentice mentor and a detailed application.'
  },
  {
    name: 'All-Star Trailhead Ranger',
    description: 'Achieved highest Trailhead rank through continuous learning',
    date: 'Ongoing',
    image: '/img/trailhead-ranger-badge.png'
  },
];

export function AwardsTab() {
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);

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
}
