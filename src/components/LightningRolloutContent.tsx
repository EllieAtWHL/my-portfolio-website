'use client';

import { Card } from '@/components/Card';

export default function LightningRolloutContent() {
  const blogPosts = [
    {
      id: 'part-1',
      title: 'How To Persuade Your Business To Let Lightning Strike',
      subtitle: 'Part 1: Discovery Phase',
      description: 'Before starting the Salesforce migration from Classic to Lightning, you need buy-in from all levels of the business. This guide can provide ideas on how to achieve that.',
      image: '/lightning-rollout/lightning.jpeg',
      originalPostDate: 'April 2020',
      originalUrl: 'https://medium.com/@eleanormatthewman/salesforce-lightning-rollout-dbe57d8d3670',
      slug: 'part-1'
    },
    {
      id: 'part-2',
      title: 'Running the Migration Project',
      subtitle: 'Part 2: Implementation Phase',
      description: 'This guide can provide you with the information you need to successfully complete the steps needed to migrate from Salesforce Classic to Lightning.',
      image: '/lightning-rollout/lightningReadinessReport.gif',
      originalPostDate: 'April 2020',
      slug: 'part-2'
    },
    {
      id: 'part-3',
      title: "We've Migrated to Lightning, Now What?",
      subtitle: 'Part 3: Post-Migration Phase',
      description: 'This guide walks you through the steps you can take after migration to ensure that it is adopted by users successfully.',
      image: '/lightning-rollout/lightning.jpeg',
      originalPostDate: 'April 2020',
      slug: 'part-3'
    }
  ];

  return (
    <div className="lightning-rollout-container">
      <div className="blog-header">
        <h1 className="blog-title">Salesforce Lightning Rollout Series</h1>
        <p className="blog-subtitle">A comprehensive 3-part guide to successfully migrating from Salesforce Classic to Lightning</p>
      </div>

      <Card variant="highlight" padding="md">
        <p>I am currently working on my third roll-out of Lightning and so am sharing some of my learnings to help ensure yours goes smoothly. Everything I speak about below are things that have worked for me, however, that doesn't mean it is the only way to do it. As with most things Salesforce, there are multiple ways of doing things, these are the way I found to be successful.</p>
      </Card>

      <div className="blog-posts-grid">
        {blogPosts.map((post) => (
          <Card key={post.id} variant="accent" padding="md" className="blog-post-card">
            <div className="post-image-container">
              <img 
                src={post.image} 
                alt={post.title}
                className="post-image"
              />
            </div>
            
            <div className="post-content">
              <div className="post-meta">
                <span className="post-subtitle">{post.subtitle}</span>
              </div>
              
              <h2 className="post-title">
                <a href={`/lightning-rollout/${post.slug}`} className="post-link">
                  {post.title}
                </a>
              </h2>
              
              <p className="post-description">{post.description}</p>
              
              <div className="post-footer">
                <a href={`/lightning-rollout/${post.slug}`} className="read-more-link">
                  Read Part {post.id.split('-')[1]} →
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
