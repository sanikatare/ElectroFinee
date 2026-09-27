import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ElectroFineLogo } from '../ui/ElectroFineLogo';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-150 ${
        isScrolled
          ? 'bg-[#009150]/95 backdrop-blur-md border-b border-white/20 py-3.5 shadow-subtle'
          : 'bg-[#009150] py-4 border-b border-white/15'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Zone 1: Brand Logo & Wordmark */}
        <Link to="/" className="whitespace-nowrap">
          <ElectroFineLogo size="md" />
        </Link>

        {/* Zone 2: Clean simple section links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/90">
          <a href="#how-it-works" className="hover:text-white transition-colors whitespace-nowrap">
            How It Works
          </a>
          <a href="#rates" className="hover:text-white transition-colors whitespace-nowrap">
            Rates
          </a>
          <Link to="/dashboard" className="hover:text-white transition-colors whitespace-nowrap">
            Dashboard
          </Link>
        </nav>

        {/* Zone 3: Login & Schedule Pickup CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap"
          >
            Login
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-bold text-[#009150] bg-white hover:bg-[#E6F4EE] rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            Schedule Pickup
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
          className="md:hidden p-2 text-white rounded-md hover:bg-white/10"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#009150] border-b border-white/20 px-6 py-5 space-y-4">
          <div className="flex flex-col space-y-3 text-sm font-semibold text-white">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#rates" onClick={() => setMobileMenuOpen(false)}>Rates</a>
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
          </div>
          <div className="pt-3 border-t border-white/15 flex flex-col gap-2.5">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-bold text-[#009150] bg-white rounded-lg"
            >
              Login / Schedule Pickup
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
