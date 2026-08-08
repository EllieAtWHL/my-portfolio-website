// components/MainSitePage.tsx
import Header from './Header';
import Footer from './Footer';
import { MainSiteWrapper } from './MainSiteWrapper';
import { SkipLink } from './SkipLink';

export default function MainSitePage({ children }: { children: React.ReactNode }) {
  return (
    <MainSiteWrapper>
      <SkipLink />
      <Header />
      {/* display:contents keeps <main> out of the box model entirely, so it
          doesn't disrupt .content's `flex: 1` (which needs .main-wrapper as
          its direct flex parent) - this is purely a semantic landmark. */}
      <main id="main-content" className="contents">{children}</main>
      <Footer />
    </MainSiteWrapper>
  );
}