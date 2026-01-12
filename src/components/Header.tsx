'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isSpursWomen = pathname?.startsWith('/spurs-women');
  const { isDarkMode } = useTheme();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation items based on route
  const navItems = isSpursWomen ? [
    { href: "/spurs-women", label: "Home" },
    { href: "/spurs-women/seasons", label: "Seasons" },
    { href: "/spurs-women/matches", label: "All Matches" },
  ] : [
    { href: "/", label: "Home" },
    { href: "/about-me", label: "About Me" },
    { href: "/experience", label: "Experience" },
    { href: "/projects", label: "Projects" },
    { href: "/spurs-women", label: "Spurs Women" },
    { href: "/contact-me", label: "Contact Me" },
  ];

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`navbar ${isSpursWomen ? 'spurs-women-navbar' : ''} ${isDarkMode ? 'dark' : ''}`}>
      <div className={`brand-title ${isSpursWomen ? 'spurs-brand-title' : ''}`}>
        <Link href="/">
          <Image 
            src="/logo.png" 
            alt={"EllieAtWHL"} 
            width={50}
            height={50}
            className="logo"
          />
        </Link>
      </div>
      
      <div 
        className={`toggle-button ${isSpursWomen ? 'spurs-toggle-button' : ''}`}
        onClick={toggleMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && toggleMenu()}
        aria-label="Toggle menu"
      >
        <span className={`bar ${isSpursWomen ? 'spurs-bar' : ''}`}></span>
        <span className={`bar ${isSpursWomen ? 'spurs-bar' : ''}`}></span>
        <span className={`bar ${isSpursWomen ? 'spurs-bar' : ''}`}></span>
      </div>

      <nav className={`navbar-links ${isMenuOpen ? 'active' : ''} ${isSpursWomen ? 'spurs-navbar-links' : ''}`}>
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={handleLinkClick}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
