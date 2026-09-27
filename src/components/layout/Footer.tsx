import React from 'react';
import { Link } from 'react-router-dom';
import { ElectroFineLogo } from '../ui/ElectroFineLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#009150] text-white/90 border-t border-white/15 py-10 text-xs">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <Link to="/" className="inline-block">
            <ElectroFineLogo size="sm" />
          </Link>
          <p className="text-white/80 text-xs">
            Schedule e-waste pickups, track your collector in real time, and get paid fairly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-white font-semibold">
          <a href="#how-it-works" className="hover:underline transition-colors">How It Works</a>
          <a href="#rates" className="hover:underline transition-colors">Rates</a>
          <Link to="/login" className="hover:underline transition-colors">Login</Link>
          <Link to="/dashboard" className="bg-white text-[#009150] px-3 py-1.5 rounded-lg font-bold hover:bg-[#E6F4EE] transition-colors">
            Dashboard →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between text-white/75 gap-3">
        <p>© 2026 ElectroFine</p>
      </div>
    </footer>
  );
};
