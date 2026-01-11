'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
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
              <Link href="/" className="text-white hover:text-gray-200 hover:underline">Home</Link>
            </li>
            <li>
              <Link href="/about" className="text-white hover:text-gray-200 hover:underline">About</Link>
            </li>
            <li>
              <Link href="/experience" className="text-white hover:text-gray-200 hover:underline">Experience</Link>
            </li>
            <li>
              <Link href="/spurs-women" className="text-white hover:text-gray-200 hover:underline">Spurs Women</Link>
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
              <Link href="/" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>Home</Link>
            </li>
            <li>
              <Link href="/about" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>About</Link>
            </li>
            <li>
              <Link href="/experience" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>Experience</Link>
            </li>
            <li>
              <Link href="/spurs-women" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>Spurs Women</Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
