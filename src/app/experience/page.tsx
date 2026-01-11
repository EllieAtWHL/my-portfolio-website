import Footer from '@/components/Footer';
import ExperienceContent from '@/components/ExperienceContent';

export const metadata = {
  title: 'Experience',
  description: 'My Salesforce experience and certifications',
  openGraph: {
    title: 'EllieAtWHL - Experience',
    description: 'My Salesforce experience and certifications',
    url: 'https://ellieatwhl.co.uk/experience',
    images: ['/experience/img/SF-Certified_Platform-Developer-II.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EllieAtWHL - Experience',
    description: 'My Salesforce experience and certifications',
    images: ['/experience/img/SF-Certified_Platform-Developer-II.png'],
  },
};

export default function Experience() {
  return (
    <div className="content">
      <div className="scrollable">
        <ExperienceContent />
      </div>
      
      <Footer />
    </div>
  );
}
