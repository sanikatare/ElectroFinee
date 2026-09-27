import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CalendarPlus, MapPin, DollarSign
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ElectroFineLogo } from '../components/ui/ElectroFineLogo';
import { DEVICE_CATEGORIES, BASE_RATES_PER_KG } from '../lib/api';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ef-canvas text-juris-textPrimary font-sans flex flex-col justify-between">
      <Navbar />

      <main>
        {/* ===================================================================
            HERO SECTION — #009150 Signature Green
        ==================================================================== */}
        <section className="relative pt-28 pb-20 md:pt-36 md:pb-24 bg-[#009150] text-white overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Clear Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                Schedule e-waste pickups, track your collector live & get paid fairly.
              </h1>

              <p className="text-base sm:text-lg text-white/90 max-w-2xl font-normal leading-relaxed">
                ElectroFine helps individuals and businesses dispose of electronic waste responsibly. Book a convenient pickup slot, track your collector in real time, and receive transparent payouts based on recyclable value.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#E6F4EE] text-[#009150] font-bold text-sm inline-flex items-center gap-2.5 transition-all shadow-lg whitespace-nowrap"
                >
                  <span>Schedule a Pickup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3.5 rounded-xl bg-[#007540] hover:bg-[#006336] text-white border border-white/25 font-semibold text-sm transition-all whitespace-nowrap"
                >
                  Open Dashboard
                </button>
              </div>
            </div>

            {/* Right Column: Clean Live Pickup Status Card */}
            <div className="lg:col-span-5">
              <div className="ef-highlight-card rounded-2xl p-6 space-y-5 text-white">
                <div className="flex items-center justify-between border-b border-white/20 pb-4">
                  <div className="flex items-center gap-3">
                    <ElectroFineLogo size="sm" showText={false} />
                    <div>
                      <p className="text-xs text-[#A7F3D0] font-semibold">Active Pickup</p>
                      <h2 className="text-lg font-bold text-white mt-0.5">
                        Rajesh Patil — Collector Assigned
                      </h2>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#A7F3D0] font-bold tabular-nums">EF-108</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-black/20 border border-white/15 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">On the Way</p>
                      <p className="text-white/80 mt-0.5">ETA 11 mins · Slot: 03:00 PM - 05:00 PM</p>
                    </div>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-3.5 py-1.5 rounded-lg bg-white text-[#009150] font-bold text-xs whitespace-nowrap hover:bg-[#E6F4EE] transition-colors"
                    >
                      Track Live
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/20 border border-white/15 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">Estimated Payout (5.1 kg)</span>
                      <span className="text-[#A7F3D0] font-extrabold text-base tabular-nums">₹4,680</span>
                    </div>
                    <p className="text-white/80 font-mono text-[11px]">
                      2x Laptops + 3x Smartphones · UPI Payout
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-white/75">Digital recycling receipt included</span>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-white hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>Login to Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            HOW IT WORKS — 3 Simple Steps
        ==================================================================== */}
        <section id="how-it-works" className="py-16 px-6 max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-juris-textPrimary">
              How It Works
            </h2>
            <p className="text-sm text-juris-textMuted">
              Recycle your old electronics in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-juris-border shadow-subtle space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#E6F4EE] text-[#009150] flex items-center justify-center">
                <CalendarPlus className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-juris-textPrimary">
                1. Request Pickup
              </h3>
              <p className="text-xs text-juris-textMuted leading-relaxed">
                Enter your address, preferred time slot, and item details (device type, quantity, condition, and approximate weight).
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-juris-border shadow-subtle space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#E6F4EE] text-[#009150] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-juris-textPrimary">
                2. Live Collector Tracking
              </h3>
              <p className="text-xs text-juris-textMuted leading-relaxed">
                Track your assigned collector on the map and follow live status updates from Scheduled to Completed.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-juris-border shadow-subtle space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#E6F4EE] text-[#009150] flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-juris-textPrimary">
                3. Verification & Fair Payout
              </h3>
              <p className="text-xs text-juris-textMuted leading-relaxed">
                Items are checked and weighed at pickup. Receive your fair payment and a digital receipt.
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================================
            E-WASTE PAYOUT RATES — Clean Rate Card Grid
        ==================================================================== */}
        <section id="rates" className="pb-20 px-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-8 border border-juris-border shadow-subtle space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-juris-border pb-5">
              <div>
                <h2 className="text-2xl font-extrabold text-juris-textPrimary">
                  E-Waste Payout Rates (₹ / kg)
                </h2>
                <p className="text-xs text-juris-textMuted mt-1">
                  Base valuation rates by device category before condition and quantity adjustments.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-xl bg-[#009150] text-white text-xs font-bold hover:bg-[#007540] transition-colors inline-flex items-center gap-2 shrink-0"
              >
                <span>Schedule Pickup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs tabular-nums">
              {DEVICE_CATEGORIES.map((category) => (
                <div
                  key={category}
                  className="p-4 rounded-xl bg-juris-bgSecondary border border-juris-border flex items-center justify-between"
                >
                  <span className="font-bold text-juris-textPrimary">{category}</span>
                  <span className="font-mono font-extrabold text-[#009150] text-sm">
                    ₹{BASE_RATES_PER_KG[category]}/kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
