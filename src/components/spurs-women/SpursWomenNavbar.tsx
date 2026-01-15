'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-spurs-navy text-white shadow p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">
            <Link href="/">
                <img src="/logo.png" alt="Spurs Women" className="h-10" />
            </Link>
        </h1>

        {/* Desktop Links */}
        <ul className="hidden md:flex gap-6">
          <li>
            <Link href="/" className="text-white hover:text-gray-200 hover:underline">Home</Link>
          </li>
          <li>
            <Link href="/about" className="text-white hover:text-gray-200 hover:underline">About</Link>
          </li>
          <li>
            <Link href="/seasons" className="text-white hover:text-gray-200 hover:underline">Seasons</Link>
          </li>
          <li>
            <Link href="/matches" className="text-white hover:text-gray-200 hover:underline">All Matches</Link>
          </li>
        </ul>

        {/* Hamburger button for mobile */}
        <button
          className="md:hidden text-white font-bold text-2xl flex items-center justify-end"
          onClick={() => setOpen(!open)}
        >
          <span className="text-3xl">☰</span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <ul className="flex flex-col gap-2 mt-4 md:hidden text-right">
          <li>
            <Link href="/spurs-women" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>Home</Link>
          </li>
          <li>
            <Link href="/spurs-women/about" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>About</Link>
          </li>
          <li>
            <Link href="/spurs-women/seasons" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>Seasons</Link>
          </li>
          <li>
            <Link href="/spurs-women/matches" className="text-white hover:text-gray-200 hover:underline" onClick={() => setOpen(false)}>All Matches</Link>
          </li>
        </ul>
      )}
    </nav>
  );
}
