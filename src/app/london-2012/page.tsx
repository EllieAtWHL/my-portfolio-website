import MainSitePage from '@/components/MainSitePage';
import London2012Layout from '@/components/London2012Layout';
import London2012Gallery from '@/components/London2012Gallery';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EllieAtWHL - London 2012',
  description: 'My journey as a volunteer performer at the London 2012 Olympic Games',
  openGraph: {
    title: 'EllieAtWHL - Volunteering at London 2012',
    description: 'My journey as a volunteer performer at the London 2012 Olympic Games',
    url: '/london-2012',
    type: 'website',
  },
};

export default function London2012Page() {
  return (
    <MainSitePage>
      <London2012Layout>
        <London2012Gallery />
      </London2012Layout>
    </MainSitePage>
  );
}
