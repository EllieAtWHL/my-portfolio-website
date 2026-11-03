import ExperienceContent from '@/components/ExperienceContent';
import MainSitePage from '@/components/MainSitePage';

export const metadata = {
  title: 'Experience',
  description: 'My Salesforce experience and certifications',
  openGraph: {
    title: 'Experience | Ellie Matthewman',
    description: 'My Salesforce experience and certifications',
    url: 'https://ellieatwhl.co.uk/experience',
    images: ['/img/SF-Certified_Platform-Developer-II.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Experience | Ellie Matthewman',
    description: 'My Salesforce experience and certifications',
    images: ['/img/SF-Certified_Platform-Developer-II.png'],
  },
};

export default function Experience() {
  return (
    <MainSitePage>
      <div className="content-with-footer">
        <div className="scrollable">
          <ExperienceContent />
        </div>
      </div>
    </MainSitePage>
  );
}
