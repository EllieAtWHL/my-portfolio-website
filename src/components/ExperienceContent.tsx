'use client';

import { useState } from 'react';
import { WorkExperienceTab } from './experience/WorkExperienceTab';
import { VolunteerExperienceTab } from './experience/VolunteerExperienceTab';
import { CertificationsTab } from './experience/CertificationsTab';
import { AwardsTab } from './experience/AwardsTab';

const TABS = [
  { id: 'work', label: 'Work' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'certs', label: 'Certifications' },
  { id: 'awards', label: 'Awards' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ExperienceContent() {
  const [activeTab, setActiveTab] = useState<TabId>('work');

  return (
    <div className="experience-container">
      <div className="page-header">
        <h1 className="page-title">Experience</h1>
        <div className="page-subtitle">14+ Years of Technological Excellence</div>
      </div>

      <div className="tab-navigation" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            aria-controls="experience-tabpanel"
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id="experience-tabpanel" className="tab-content" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {/* sr-only: keeps the heading hierarchy unbroken (h1 -> h2 -> h3
            company-name -> h4 role-title) without a visible duplicate of
            the already-visible tab label. */}
        <h2 className="sr-only">{TABS.find((tab) => tab.id === activeTab)?.label}</h2>
        {activeTab === 'work' && <WorkExperienceTab />}
        {activeTab === 'volunteer' && <VolunteerExperienceTab />}
        {activeTab === 'certs' && <CertificationsTab />}
        {activeTab === 'awards' && <AwardsTab />}
      </div>
    </div>
  );
}
