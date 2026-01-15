// components/MainSitePage.tsx
import Header from './Header';
import Footer from './Footer';

export default function MainSitePage({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrapper">
      <Header />
      {children}
      <Footer />
    </div>
  );
}