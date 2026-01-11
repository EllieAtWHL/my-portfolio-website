'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SpursWomenNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="flex justify-between items-center">
        <h1 className="brand-title">
            <Link href="/">
                <img src="/logo.png" alt="EllieAtWHL" className="h-10" />
            </Link>
        </h1>

        {/* Desktop Links */}
        <div className="navbar-links">
          <ul>
            <li>
              <Link href="/spurs-women" className="text-white hover:text-gray-200 hover:underline">Home</Link>
            </li>
            <li>
              <Link href="/spurs-women/seasons" className="text-white hover:text-gray-200 hover:underline">Seasons</Link>
            </li>
            <li>
              <Link href="/spurs-women/matches" className="text-white hover:text-gray-200 hover:underline">All Matches</Link>
            </li>
          </ul>
        </div>

        {/* Hamburger button for mobile */}
        <button
          className="toggle-button"
          onClick={() => setOpen(!open)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="navbar-links active">
          <ul>
            <li>
              <Link href="/spurs-women" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>Home</Link>
            </li>
            <li>
              <Link href="/spurs-women/seasons" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>Seasons</Link>
            </li>
            <li>
              <Link href="/spurs-women/matches" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>All Matches</Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
