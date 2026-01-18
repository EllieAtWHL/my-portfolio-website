'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkMode } = useTheme();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation items for main site
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about-me", label: "About Me" },
    { href: "/experience", label: "Experience" },
    { href: "/projects", label: "Projects" },
    { href: "/london-2012", label: "London 2012" },
    { href: "/spurs-women", label: "Spurs Women" },
    { href: "/contact-me", label: "Contact Me" },
  ];

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`navbar ${isDarkMode ? 'dark' : ''}`}>
      <div className="brand-title">
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
        className="toggle-button"
        onClick={toggleMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && toggleMenu()}
        aria-label="Toggle menu"
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>

      <nav className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
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
