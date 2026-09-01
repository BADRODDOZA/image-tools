"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-container">

        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenu}
          className="site-logo"
        >
          🖼️ Image Tools
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link href="/" className="nav-link">
            🏠 Home
          </Link>

          <Link href="/tools" className="nav-link">
            🛠️ Tools
          </Link>

          <a href="/#faq" className="nav-link">
            ❓ FAQ
          </a>

          <a href="/#contact" className="nav-link">
            📩 Contact
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="mobile-menu-button"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav className="mobile-nav">

          <Link
            href="/"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            🏠 Home
          </Link>

          <Link
            href="/tools"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            🛠️ Tools
          </Link>

          <a
            href="/#faq"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            ❓ FAQ
          </a>

          <a
            href="/#contact"
            onClick={closeMenu}
            className="mobile-nav-link"
          >
            📩 Contact
          </a>

        </nav>
      )}
    </header>
  );
}