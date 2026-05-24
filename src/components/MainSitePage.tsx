// components/MainSitePage.tsx
import Header from './Header';
import Footer from './Footer';
import { MainSiteWrapper } from './MainSiteWrapper';

export default function MainSitePage({ children }: { children: React.ReactNode }) {
  return (
    <MainSiteWrapper>
      <Header />
      {children}
      <Footer />
    </MainSiteWrapper>
  );
}