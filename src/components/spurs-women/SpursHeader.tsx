'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation items for main site
  const navItems = [
    { href: "/spurs-women", label: "Home" },
    { href: "/spurs-women/seasons", label: "Seasons" },
    { href: "/spurs-women/matches", label: "Matches" }
  ];

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="spurs navbar">
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

      <nav className={`navbar-links spurs-links ${isMenuOpen ? 'active' : ''}`}>
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
