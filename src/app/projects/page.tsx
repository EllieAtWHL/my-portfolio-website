import ProjectsContent from '@/components/ProjectsContent';
import MainSitePage from '@/components/MainSitePage';

export const metadata = {
  title: 'Projects',
  description: 'Links to my various projects, from Salesforce and general web development, to blogs on some of my exciting volunteering experiences.',
  openGraph: {
    title: 'EllieAtWHL - Projects',
    description: 'Links to my various projects, from Salesforce and general web development, to blogs on some of my exciting volunteering experiences.',
    url: 'https://ellieatwhl.co.uk/projects',
    type: 'website',
    images: [
      {
        url: 'https://ellieatwhl.co.uk/favicon.ico',
        width: 1200,
        height: 630,
        alt: 'EllieAtWHL Projects',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Projects',
    description: 'Links to my various projects, from Salesforce and general web development, to blogs on some of my exciting volunteering experiences.',
    images: ['https://ellieatwhl.co.uk/favicon.ico'],
  },
};

export default function Projects() {
  return (
    <MainSitePage>
      <div className="content">
        <div className="scrollable">
          <ProjectsContent />
        </div>
      </div>
    </MainSitePage>
  );
}
