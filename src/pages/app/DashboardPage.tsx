import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Truck, DollarSign, Leaf, Scale, MapPin,
  CheckCircle2, FileCheck2, Plus, Trash2,
  Navigation, LogOut, X, Clock, Play, Pause, Printer, ArrowRight
} from 'lucide-react';
import { ElectroFineLogo, Button, Card, Input } from '../../components/ui/ElectroFineLogo';
import {
  electrofineApi,
  DEVICE_CATEGORIES,
  ITEM_CONDITIONS,
  BASE_RATES_PER_KG,
  CONDITION_MULTIPLIERS,
  DeviceCategory,
  ItemCondition,
  EWasteItem,
  QuoteBreakdown,
  PickupRecord,
  PickupStatus
} from '../../lib/api';

const TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
  '03:00 PM - 05:00 PM',
  '05:00 PM - 07:00 PM'
];

const SERVICE_AREAS = [
  'Kothrud, Pune',
  'Hinjewadi, Pune',
  'Hadapsar, Pune',
  'Bandra, Mumbai',
  'Indiranagar, Bengaluru'
];

const STATUS_FLOW: PickupStatus[] = [
  'Scheduled',
  'Collector Assigned',
  'On the Way',
  'Arrived',
  'Collected',
  'Completed'
];

type DashboardTab = 'overview' | 'schedule' | 'payouts';
type PickupFilter = 'All' | 'Active' | 'Completed' | 'Cancelled';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'Collector' ? 'Collector' : 'Recycler';

  const [roleMode, setRoleMode] = useState<'Recycler' | 'Collector'>(initialRole);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [pickupFilter, setPickupFilter] = useState<PickupFilter>('All');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // User & Summary Metrics
  const [userName, setUserName] = useState('Aarav Sharma');
  const [pickups, setPickups] = useState<PickupRecord[]>([]);
  const [metrics, setMetrics] = useState({
    totalPickups: 3,
    activePickups: 1,
    totalKgRecycled: 36.6,
    totalCo2AvoidedKg: 98.8,
    totalEarningsUsd: 21450,
    pointsBalance: 3400
  });

  // 1. Smart Pickup Scheduling Form State
  const [address, setAddress] = useState(
    'Flat 402, Green Valley Residency, Kothrud, Pune'
  );
  const [areaZone, setAreaZone] = useState('Kothrud, Pune');
  const [scheduledDate, setScheduledDate] = useState('28 Oct 2026');
  const [scheduledSlot, setScheduledSlot] = useState('03:00 PM - 05:00 PM');
  const [payoutMethod, setPayoutMethod] = useState('UPI (aarav@okaxis)');
  const [items, setItems] = useState<EWasteItem[]>([
    {
      id: 'NEW-1',
      category: 'Laptops & Notebooks',
      deviceName: 'Dell & HP Laptops',
      quantity: 2,
      condition: 'Good',
      approxWeightKg: 4.2
    }
  ]);
  const [liveQuote, setLiveQuote] = useState<QuoteBreakdown | null>(null);
  const [submittingPickup, setSubmittingPickup] = useState(false);

  // 2. Real-Time Collector Tracking, Simulation & Verification State
  const [trackedPickupId, setTrackedPickupId] = useState<string>('EF-108');
  const [isSimulatingRoute, setIsSimulatingRoute] = useState<boolean>(false);
  const [verifiedWeightInput, setVerifiedWeightInput] = useState<string>('5.1');
  const [verifiedConditionInput, setVerifiedConditionInput] = useState<ItemCondition>('Good');
  const [verificationNotes, setVerificationNotes] = useState<string>(
    'Items checked and weighed on digital scale.'
  );

  // 3. Reschedule & Receipt Modals
  const [reschedulingPickup, setReschedulingPickup] = useState<PickupRecord | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('30 Oct 2026');
  const [newRescheduleSlot, setNewRescheduleSlot] = useState('11:00 AM - 01:00 PM');
  const [certificatePickup, setCertificatePickup] = useState<PickupRecord | null>(null);

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const loadAllDashboardData = async (preferredId?: string) => {
    try {
      const [summaryRes, pickupsList] = await Promise.all([
        electrofineApi.getDashboardSummary(),
        electrofineApi.getPickups()
      ]);
      if (summaryRes?.metrics) setMetrics(summaryRes.metrics);
      if (summaryRes?.user?.name) {
        setUserName(summaryRes.user.name);
      } else {
        const stored = localStorage.getItem('electrofine_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.name) setUserName(parsed.name);
        }
      }
      setPickups(pickupsList);

      const targetId = preferredId || trackedPickupId;
      const active = pickupsList.find((p) => p.id === targetId) || pickupsList[0];
      if (active) {
        setTrackedPickupId(active.id);
        const w = active.items.reduce(
          (acc, i) => acc + (Number(i.verifiedWeightKg ?? i.approxWeightKg) || 0),
          0
        );
        setVerifiedWeightInput(w.toFixed(1));
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  useEffect(() => {
    electrofineApi.estimatePricing(items).then(setLiveQuote).catch(() => {});
  }, [items]);

  const trackedPickup =
    pickups.find((p) => p.id === trackedPickupId) || pickups[0] || null;

  // Live GPS Collector Route Simulation Effect
  useEffect(() => {
    if (!isSimulatingRoute || !trackedPickup) return;
    if (trackedPickup.status === 'Completed' || trackedPickup.status === 'Cancelled') {
      setIsSimulatingRoute(false);
      return;
    }

    const timer = setInterval(async () => {
      const currLat = trackedPickup.collector.currentLat;
      const currLng = trackedPickup.collector.currentLng;
      const destLat = trackedPickup.collector.destLat;
      const destLng = trackedPickup.collector.destLng;

      const nextLat = Number((currLat + (destLat - currLat) * 0.35).toFixed(4));
      const nextLng = Number((currLng + (destLng - currLng) * 0.35).toFixed(4));
      const nextEta = Math.max(0, trackedPickup.collector.etaMinutes - 3);

      let nextStatus: PickupStatus = trackedPickup.status;
      if (trackedPickup.status === 'Scheduled') {
        nextStatus = 'Collector Assigned';
      } else if (trackedPickup.status === 'Collector Assigned') {
        nextStatus = 'On the Way';
      } else if (trackedPickup.status === 'On the Way' && nextEta === 0) {
        nextStatus = 'Arrived';
      }

      const updated = await electrofineApi.updateTracking(trackedPickup.id, {
        status: nextStatus,
        currentLat: nextLat,
        currentLng: nextLng,
        etaMinutes: nextEta
      });

      await loadAllDashboardData(updated.id);

      if (nextStatus === 'Arrived') {
        setIsSimulatingRoute(false);
        showToast(`Collector ${updated.collector.name} has arrived at the pickup location!`);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [isSimulatingRoute, trackedPickup]);

  // Filtered Pickups List
  const filteredPickups = pickups.filter((p) => {
    if (pickupFilter === 'All') return true;
    if (pickupFilter === 'Active') return p.status !== 'Completed' && p.status !== 'Cancelled';
    if (pickupFilter === 'Completed') return p.status === 'Completed';
    if (pickupFilter === 'Cancelled') return p.status === 'Cancelled';
    return true;
  });

  // Smart Pickup Handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `NEW-${Date.now()}`,
        category: 'Smartphones & Tablets',
        deviceName: 'Smartphones',
        quantity: 2,
        condition: 'Damaged',
        approxWeightKg: 0.6
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof EWasteItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPickup(true);
    try {
      const created = await electrofineApi.createPickup({
        userName,
        address,
        areaZone,
        scheduledDate,
        scheduledSlot,
        payoutMethod,
        items
      });
      await loadAllDashboardData(created.id);
      setActiveTab('overview');
      showToast(`Pickup ${created.id} scheduled. Collector ${created.collector.name} assigned.`);
    } finally {
      setSubmittingPickup(false);
    }
  };

  // Live Tracking & Collector Handlers
  const handleStatusUpdate = async (nextStatus: PickupStatus, includeVerification = false) => {
    if (!trackedPickup) return;
    const updated = await electrofineApi.updateTracking(trackedPickup.id, {
      status: nextStatus,
      ...(includeVerification
        ? {
            verifiedWeightKg: Number(verifiedWeightInput) || 5.0,
            verifiedCondition: verifiedConditionInput,
            notes: verificationNotes || 'Items checked and weighed on digital scale.'
          }
        : {})
    });
    await loadAllDashboardData(updated.id);
    showToast(
      includeVerification
        ? `Pickup ${updated.id} verified (${verifiedWeightInput} kg) & marked ${nextStatus}.`
        : `Pickup ${updated.id} status updated to "${nextStatus}".`
    );
  };

  const handleAdvanceNextStep = async () => {
    if (!trackedPickup) return;
    const currentIndex = STATUS_FLOW.indexOf(trackedPickup.status);
    if (currentIndex < 0 || currentIndex >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIndex + 1];
    const shouldVerify = nextStatus === 'Collected' || nextStatus === 'Completed';
    await handleStatusUpdate(nextStatus, shouldVerify);
  };

  const handleSettlePayout = async (pickupId: string) => {
    const updated = await electrofineApi.processPayout(pickupId);
    await loadAllDashboardData(pickupId);
    if (updated?.pickup && certificatePickup?.id === pickupId) {
      setCertificatePickup(updated.pickup);
    }
    showToast(`Payout settled and digital receipt finalized for Pickup ${pickupId}.`);
  };

  const handleCancelPickup = async (pickupId: string) => {
    await electrofineApi.cancelPickup(pickupId);
    await loadAllDashboardData(pickupId);
    showToast(`Pickup ${pickupId} cancelled.`);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingPickup) return;
    await electrofineApi.reschedulePickup(
      reschedulingPickup.id,
      newRescheduleDate,
      newRescheduleSlot
    );
    await loadAllDashboardData(reschedulingPickup.id);
    showToast(`Pickup ${reschedulingPickup.id} rescheduled to ${newRescheduleDate} (${newRescheduleSlot}).`);
    setReschedulingPickup(null);
  };

  const nextMilestone =
    trackedPickup && STATUS_FLOW.indexOf(trackedPickup.status) < STATUS_FLOW.length - 1
      ? STATUS_FLOW[STATUS_FLOW.indexOf(trackedPickup.status) + 1]
      : null;

  return (
    <div className="min-h-screen bg-ef-canvas text-juris-textPrimary font-sans">
      {/* =====================================================================
          CLEAN TOP NAVIGATION BAR
      ====================================================================== */}
      <header className="sticky top-0 z-40 bg-[#009150] text-white border-b border-white/15 px-6 py-3.5 shadow-subtle">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Brand + Main Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/">
              <ElectroFineLogo size="sm" />
            </Link>

            <nav className="flex items-center gap-1 bg-[#007540] p-1 rounded-xl border border-white/15">
              {[
                { id: 'overview', label: 'Live Tracking & Pickups' },
                { id: 'schedule', label: 'Schedule Pickup' },
                { id: 'payouts', label: 'Payouts & Receipts' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-[#009150]'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right: User / Collector Mode Switcher + Schedule CTA + Home */}
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline-block text-xs text-white/90 font-semibold">
              {roleMode === 'Collector' ? 'Collector: Rajesh Patil' : userName}
            </span>

            <div className="flex items-center bg-[#007540] p-1 rounded-lg border border-white/15 text-xs font-semibold">
              <button
                onClick={() => setRoleMode('Recycler')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  roleMode === 'Recycler' ? 'bg-white text-[#009150] font-bold' : 'text-white/85 hover:text-white'
                }`}
              >
                User View
              </button>
              <button
                onClick={() => {
                  setRoleMode('Collector');
                  setActiveTab('overview');
                }}
                className={`px-3 py-1 rounded-md transition-colors ${
                  roleMode === 'Collector' ? 'bg-white text-[#009150] font-bold' : 'text-white/85 hover:text-white'
                }`}
              >
                Collector View
              </button>
            </div>

            {activeTab !== 'schedule' && roleMode === 'Recycler' && (
              <button
                onClick={() => setActiveTab('schedule')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-[#009150] text-xs font-bold hover:bg-[#E6F4EE] transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Pickup</span>
              </button>
            )}

            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10 text-xs inline-flex items-center gap-1"
              title="Back to Home"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {statusNotice && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="rounded-xl bg-[#009150] text-white px-4 py-3 flex items-center justify-between text-xs font-semibold shadow-subtle border border-white/25">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>{statusNotice}</span>
            </div>
            <button onClick={() => setStatusNotice(null)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAIN DASHBOARD CONTENT
      ====================================================================== */}
      <main className="max-w-7xl mx-auto px-6 py-7 space-y-7">
        {/* Collector Mode Active Banner */}
        {roleMode === 'Collector' && trackedPickup && (
          <div className="rounded-2xl bg-[#009150] text-white p-5 flex flex-wrap items-center justify-between gap-4 shadow-subtle">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#A7F3D0]">
                Collector Workflow Console · Route Vehicle {trackedPickup.collector.vehicleNumber}
              </p>
              <h2 className="text-lg font-extrabold text-white">
                Assigned Pickup {trackedPickup.id} — {trackedPickup.userName} ({trackedPickup.areaZone})
              </h2>
              <p className="text-xs text-white/85">
                {trackedPickup.address} · Slot: {trackedPickup.scheduledSlot}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {nextMilestone && trackedPickup.status !== 'Cancelled' && (
                <button
                  onClick={handleAdvanceNextStep}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#009150] font-bold text-xs inline-flex items-center gap-1.5 shadow-sm hover:bg-[#E6F4EE] transition-colors"
                >
                  <span>Mark "{nextMilestone}"</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setRoleMode('Recycler')}
                className="px-3.5 py-2.5 rounded-xl bg-[#007540] text-white text-xs font-semibold border border-white/20 hover:bg-[#005C32]"
              >
                Switch to User View
              </button>
            </div>
          </div>
        )}

        {/* 4 Clean Summary Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
          <Card className="space-y-1">
            <div className="flex items-center justify-between text-xs text-juris-textMuted font-semibold">
              <span>Total Pickups</span>
              <Truck className="w-4 h-4 text-[#009150]" />
            </div>
            <p className="text-2xl font-extrabold text-juris-textPrimary">{metrics.totalPickups}</p>
            <p className="text-xs text-juris-textSubtle">{metrics.activePickups} active in progress</p>
          </Card>

          <Card className="space-y-1">
            <div className="flex items-center justify-between text-xs text-juris-textMuted font-semibold">
              <span>E-Waste Recycled</span>
              <Scale className="w-4 h-4 text-[#009150]" />
            </div>
            <p className="text-2xl font-extrabold text-juris-textPrimary">{metrics.totalKgRecycled} kg</p>
            <p className="text-xs text-juris-textSubtle">Verified weight</p>
          </Card>

          <Card className="space-y-1">
            <div className="flex items-center justify-between text-xs text-juris-textMuted font-semibold">
              <span>CO₂ Avoided</span>
              <Leaf className="w-4 h-4 text-[#009150]" />
            </div>
            <p className="text-2xl font-extrabold text-juris-textPrimary">{metrics.totalCo2AvoidedKg} kg</p>
            <p className="text-xs text-[#009150] font-semibold">Environmental impact</p>
          </Card>

          <Card className="space-y-1">
            <div className="flex items-center justify-between text-xs text-juris-textMuted font-semibold">
              <span>Total Earnings</span>
              <DollarSign className="w-4 h-4 text-[#009150]" />
            </div>
            <p className="text-2xl font-extrabold text-juris-textPrimary">
              ₹{metrics.totalEarningsUsd.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-juris-textSubtle">Fair valuation payouts</p>
          </Card>
        </section>

        {/* ===================================================================
            TAB 1: LIVE TRACKING & PICKUPS OVERVIEW
        ==================================================================== */}
        {activeTab === 'overview' && trackedPickup && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* LEFT 7 COLS: Live Collector Map, Status Stepper & Collector Verification */}
            <div className="lg:col-span-7 space-y-5">
              <Card padding="lg" className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-juris-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ef-mintSoft text-[#009150] flex items-center justify-center font-bold">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-juris-textPrimary">
                          Live Collector Tracking
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-md bg-ef-mintSoft text-[#009150] text-xs font-bold">
                          {trackedPickup.status}
                        </span>
                      </div>
                      <p className="text-xs text-juris-textMuted mt-0.5">
                        Collector: <strong className="text-juris-textPrimary">{trackedPickup.collector.name}</strong> · {trackedPickup.collector.phone} · Vehicle {trackedPickup.collector.vehicleNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {trackedPickup.status !== 'Completed' && trackedPickup.status !== 'Cancelled' && (
                      <Button
                        size="sm"
                        variant={isSimulatingRoute ? 'danger' : 'secondary'}
                        icon={isSimulatingRoute ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        onClick={() => setIsSimulatingRoute((prev) => !prev)}
                      >
                        {isSimulatingRoute ? 'Pause Live GPS' : 'Simulate Live GPS'}
                      </Button>
                    )}

                    <select
                      value={trackedPickup.id}
                      onChange={(e) => {
                        setIsSimulatingRoute(false);
                        setTrackedPickupId(e.target.value);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-juris-border bg-juris-bgSecondary text-xs font-bold text-juris-textPrimary"
                    >
                      {pickups.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id} — {p.areaZone} ({p.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Map Embed */}
                <div className="relative h-72 rounded-xl overflow-hidden border border-juris-border bg-juris-bgSecondary">
                  <iframe
                    title={`Map — ${trackedPickup.address}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      trackedPickup.address
                    )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  />

                  <div className="absolute bottom-3 left-3 right-3 bg-[#009150]/95 text-white rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums shadow-md">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white shrink-0" />
                      <span className="truncate max-w-xs font-medium">{trackedPickup.address}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="hidden sm:inline text-white/80 text-[11px]">
                        {trackedPickup.collector.currentLat.toFixed(4)}°N, {trackedPickup.collector.currentLng.toFixed(4)}°E
                      </span>
                      <span className="bg-white text-[#009150] px-2.5 py-0.5 rounded-md font-extrabold">
                        {trackedPickup.status === 'Completed'
                          ? 'Completed'
                          : trackedPickup.collector.etaMinutes === 0
                          ? 'Arrived'
                          : `ETA: ${trackedPickup.collector.etaMinutes} mins`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6-Step Status Transitions */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-juris-textPrimary">
                      Pickup Status Progression
                    </span>
                    {roleMode === 'Collector' && nextMilestone && trackedPickup.status !== 'Cancelled' ? (
                      <button
                        onClick={handleAdvanceNextStep}
                        className="text-[#009150] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Advance to "{nextMilestone}"</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      roleMode === 'Recycler' &&
                      trackedPickup.status !== 'Completed' && (
                        <button
                          onClick={() => setRoleMode('Collector')}
                          className="text-[#009150] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Switch to Collector View to Verify Weight & Status</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {STATUS_FLOW.map((st) => {
                      const currentIdx = STATUS_FLOW.indexOf(trackedPickup.status);
                      const stepIdx = STATUS_FLOW.indexOf(st);
                      const isCurrent = trackedPickup.status === st;
                      const isDone = currentIdx > stepIdx;
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusUpdate(st, st === 'Collected' || st === 'Completed')}
                          className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all truncate ${
                            isCurrent
                              ? 'bg-[#009150] text-white border-[#009150]'
                              : isDone
                              ? 'bg-ef-mintSoft text-[#009150] border-[#009150]/30'
                              : 'bg-juris-bgSecondary text-juris-textMuted border-juris-border hover:border-juris-borderDark'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Collector Verification Input (Shown in Collector View) */}
                {roleMode === 'Collector' && (
                  <div className="pt-4 border-t border-juris-border space-y-3 bg-juris-bgSecondary/60 -mx-7 -mb-7 p-6 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-extrabold text-juris-textPrimary">
                          Collector Doorstep Verification & Scale Weighment
                        </h3>
                        <p className="text-[11px] text-juris-textMuted">
                          Enter actual scale weight and device condition to finalize payout & digital receipt
                        </p>
                      </div>
                      <span className="text-xs text-[#009150] font-mono font-bold tabular-nums">
                        Quote: ₹{trackedPickup.quote.finalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-end">
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block font-semibold text-juris-textBody">Scale Weight (kg)</label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={verifiedWeightInput}
                          onChange={(e) => setVerifiedWeightInput(e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block font-semibold text-juris-textBody">Verified Condition</label>
                        <select
                          value={verifiedConditionInput}
                          onChange={(e) => setVerifiedConditionInput(e.target.value as ItemCondition)}
                          className="w-full px-3 py-2 rounded-md border border-juris-border bg-white font-semibold text-sm"
                        >
                          {ITEM_CONDITIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-6 space-y-1">
                        <label className="block font-semibold text-juris-textBody">Verification Note</label>
                        <Input
                          type="text"
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="Weighed on digital scale"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusUpdate('Collected', true)}
                      >
                        Verify & Mark Collected
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStatusUpdate('Completed', true)}
                      >
                        Verify, Complete & Pay ₹{trackedPickup.quote.finalAmount.toLocaleString('en-IN')}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT 5 COLS: Selected Pickup Timeline + All Pickups List */}
            <div className="lg:col-span-5 space-y-5">
              {/* Selected Pickup Timeline Card */}
              <Card padding="lg" className="space-y-4">
                <div className="flex items-center justify-between border-b border-juris-border pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#009150]">
                      {trackedPickup.id} · {trackedPickup.userName}
                    </span>
                    <h3 className="text-base font-extrabold text-juris-textPrimary">
                      Pickup Status Timeline
                    </h3>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="text-lg font-extrabold text-juris-textPrimary">
                      ₹{trackedPickup.quote.finalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs font-semibold text-[#009150]">{trackedPickup.payoutStatus}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {trackedPickup.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                          step.completed
                            ? 'bg-[#009150] text-white'
                            : step.active
                            ? 'bg-ef-mintSoft text-[#009150] border border-[#009150]'
                            : 'bg-juris-bgMuted text-juris-textMuted'
                        }`}
                      >
                        {step.completed ? '✓' : idx + 1}
                      </span>
                      <div className="flex-1">
                        <p
                          className={`font-bold ${
                            step.completed || step.active
                              ? 'text-juris-textPrimary'
                              : 'text-juris-textSubtle'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-juris-textMuted">{step.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* All Scheduled & Past Pickups List with Filter */}
              <Card padding="lg" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-juris-textPrimary">
                    Pickups ({filteredPickups.length})
                  </h3>
                  <div className="flex items-center gap-1 bg-juris-bgSecondary p-1 rounded-lg border border-juris-border text-[11px] font-bold">
                    {(['All', 'Active', 'Completed', 'Cancelled'] as PickupFilter[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setPickupFilter(f)}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          pickupFilter === f
                            ? 'bg-[#009150] text-white'
                            : 'text-juris-textMuted hover:text-juris-textPrimary'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredPickups.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setTrackedPickupId(p.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        trackedPickup.id === p.id
                          ? 'border-[#009150] bg-juris-bgSecondary/80'
                          : 'border-juris-border bg-white hover:border-juris-borderDark'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-juris-textPrimary">
                            {p.id}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              p.status === 'Completed'
                                ? 'text-[#009150]'
                                : p.status === 'Cancelled'
                                ? 'text-red-600'
                                : 'text-amber-700'
                            }`}
                          >
                            • {p.status}
                          </span>
                        </div>
                        <span className="font-extrabold text-sm text-juris-textPrimary tabular-nums">
                          ₹{p.quote.finalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-juris-textBody">
                        {p.items.map((i) => `${i.quantity}x ${i.deviceName}`).join(', ')}
                      </p>

                      <p className="text-xs text-juris-textMuted">
                        {p.scheduledDate} · {p.scheduledSlot} · {p.areaZone}
                      </p>

                      <div
                        className="pt-2 border-t border-juris-border flex flex-wrap items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<FileCheck2 className="w-3.5 h-3.5" />}
                          onClick={() => setCertificatePickup(p)}
                        >
                          Receipt
                        </Button>

                        {p.status !== 'Completed' && p.status !== 'Cancelled' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<Clock className="w-3.5 h-3.5" />}
                              onClick={() => {
                                setReschedulingPickup(p);
                                setNewRescheduleDate(p.scheduledDate);
                                setNewRescheduleSlot(p.scheduledSlot);
                              }}
                            >
                              Reschedule
                            </Button>
                            <button
                              onClick={() => handleCancelPickup(p.id)}
                              className="text-xs text-red-600 hover:underline font-semibold px-2"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {p.payoutStatus !== 'Paid' && p.status !== 'Cancelled' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleSettlePayout(p.id)}
                          >
                            Settle Payout
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* ===================================================================
            TAB 2: SCHEDULE A PICKUP + FAIR PAYOUT ENGINE
        ==================================================================== */}
        {activeTab === 'schedule' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* LEFT 7 COLS: Pickup Scheduling Form */}
            <form onSubmit={handleCreatePickup} className="lg:col-span-7">
              <Card padding="lg" className="space-y-5">
                <div className="border-b border-juris-border pb-3">
                  <h2 className="text-lg font-extrabold text-juris-textPrimary">
                    Schedule an E-Waste Pickup
                  </h2>
                  <p className="text-xs text-juris-textMuted mt-0.5">
                    Book a pickup slot and add your device details for an instant valuation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block font-bold text-juris-textPrimary">
                      Pickup Address
                    </label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-juris-textPrimary">Area / Location</label>
                    <select
                      value={areaZone}
                      onChange={(e) => setAreaZone(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-juris-border bg-white font-semibold text-sm text-juris-textPrimary"
                    >
                      {SERVICE_AREAS.map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-juris-textPrimary">Preferred Date</label>
                    <Input value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block font-bold text-juris-textPrimary">Preferred Time Slot</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setScheduledSlot(slot)}
                          className={`py-2 px-2.5 rounded-lg text-xs font-bold border text-center transition-all tabular-nums ${
                            scheduledSlot === slot
                              ? 'bg-[#009150] text-white border-[#009150]'
                              : 'bg-juris-bgSecondary text-juris-textBody border-juris-border hover:border-[#009150]'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block font-bold text-juris-textPrimary">Payout Method</label>
                    <Input
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      placeholder="e.g. UPI ID or Bank Account"
                      required
                    />
                  </div>
                </div>

                {/* Device Items List */}
                <div className="space-y-3 pt-3 border-t border-juris-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-juris-textPrimary">
                      Items to Recycle ({items.length})
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      onClick={handleAddItem}
                    >
                      Add Item
                    </Button>
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-juris-bgSecondary border border-juris-border grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs"
                    >
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-juris-textMuted font-semibold">Category</label>
                        <select
                          value={item.category}
                          onChange={(e) => {
                            const cat = e.target.value as DeviceCategory;
                            handleItemChange(item.id, 'category', cat);
                            handleItemChange(item.id, 'deviceName', cat.split(' ')[0]);
                          }}
                          className="w-full px-2.5 py-2 rounded-md border border-juris-border bg-white font-semibold"
                        >
                          {DEVICE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat} (₹{BASE_RATES_PER_KG[cat]}/kg)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-juris-textMuted font-semibold">Item Name</label>
                        <input
                          type="text"
                          value={item.deviceName}
                          onChange={(e) => handleItemChange(item.id, 'deviceName', e.target.value)}
                          placeholder="e.g. Dell Laptop"
                          className="w-full px-2.5 py-2 rounded-md border border-juris-border bg-white font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-juris-textMuted font-semibold">Condition</label>
                        <select
                          value={item.condition}
                          onChange={(e) =>
                            handleItemChange(item.id, 'condition', e.target.value as ItemCondition)
                          }
                          className="w-full px-2.5 py-2 rounded-md border border-juris-border bg-white font-semibold"
                        >
                          {ITEM_CONDITIONS.map((c) => (
                            <option key={c} value={c}>
                              {c} ({CONDITION_MULTIPLIERS[c]}x)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-1 space-y-1">
                        <label className="block text-juris-textMuted font-semibold">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(item.id, 'quantity', Math.max(1, Number(e.target.value)))
                          }
                          className="w-full px-2 py-2 rounded-md border border-juris-border bg-white font-mono font-bold tabular-nums"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-juris-textMuted font-semibold">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.2"
                          min={0.2}
                          value={item.approxWeightKg}
                          onChange={(e) =>
                            handleItemChange(item.id, 'approxWeightKg', Math.max(0.2, Number(e.target.value)))
                          }
                          className="w-full px-2.5 py-2 rounded-md border border-juris-border bg-white font-mono font-bold tabular-nums"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-juris-textMuted hover:text-red-600 rounded-md"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" size="lg" disabled={submittingPickup}>
                    {submittingPickup ? 'Scheduling...' : 'Confirm Pickup'}
                  </Button>
                </div>
              </Card>
            </form>

            {/* RIGHT 5 COLS: Transparent Quote Breakdown */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-[#009150] text-white p-6 space-y-5 shadow-elevated tabular-nums">
                <div className="border-b border-white/20 pb-4">
                  <p className="text-xs text-[#A7F3D0] font-bold">Fair Payout Quote Breakdown</p>
                  <h3 className="text-4xl font-extrabold text-white mt-1">
                    ₹{liveQuote ? liveQuote.finalAmount.toLocaleString('en-IN') : '3,550'}
                  </h3>
                  <p className="text-xs text-white/80 mt-1">
                    Estimated CO₂ Avoided: -{liveQuote ? liveQuote.co2AvoidedKg : 11.3} kg
                  </p>
                </div>

                {liveQuote && (
                  <div className="space-y-2.5 text-xs text-white/90">
                    <div className="flex justify-between">
                      <span>Base Category Valuation</span>
                      <span className="font-mono font-bold">
                        ₹{liveQuote.baseRateTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Condition Multiplier</span>
                      <span className="font-mono font-bold">{liveQuote.conditionFactor}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity & Market Adjustment</span>
                      <span className="font-mono font-bold">
                        {liveQuote.quantityFactor}x × {liveQuote.marketFactor}x
                      </span>
                    </div>
                    <div className="flex justify-between text-white/75">
                      <span>Pickup & Service Fee</span>
                      <span className="font-mono">-₹{liveQuote.serviceFee}</span>
                    </div>
                    <div className="pt-3 border-t border-white/20 space-y-1">
                      <span className="text-[11px] text-white/75 block">Auditable Valuation Formula:</span>
                      <p className="text-xs font-mono text-[#A7F3D0] font-bold">
                        {liveQuote.formulaString}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            TAB 3: PAYOUTS & DIGITAL RECEIPTS
        ==================================================================== */}
        {activeTab === 'payouts' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-juris-textPrimary">
                  Payout Status & Digital Receipts
                </h2>
                <p className="text-xs text-juris-textMuted">
                  Transparent payout records (Pending → Processed → Paid) and digital recycling receipts.
                </p>
              </div>
            </div>

            <div className="bg-white border border-juris-border rounded-2xl shadow-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="bg-juris-bgSecondary border-b border-juris-border font-semibold text-juris-textMuted">
                    <tr>
                      <th className="py-3.5 px-4">Pickup ID</th>
                      <th className="py-3.5 px-4">Items & Weight</th>
                      <th className="py-3.5 px-4">Formula Breakdown</th>
                      <th className="py-3.5 px-4">Payout Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-juris-border text-juris-textBody">
                    {pickups.map((p) => (
                      <tr key={p.id} className="hover:bg-juris-bgSecondary/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-juris-textPrimary font-mono">{p.id}</p>
                          <p className="text-xs text-juris-textSubtle">{p.scheduledDate}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-juris-textPrimary">
                            {p.items.map((i) => `${i.quantity}x ${i.deviceName}`).join(', ')}
                          </p>
                          <p className="text-xs text-juris-textSubtle">{p.address}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-juris-textMuted">
                          {p.quote.formulaString}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-juris-textPrimary text-sm">
                            ₹{p.quote.finalAmount.toLocaleString('en-IN')}
                          </p>
                          <p
                            className={`text-xs font-bold ${
                              p.payoutStatus === 'Paid'
                                ? 'text-[#009150]'
                                : p.payoutStatus === 'Processed'
                                ? 'text-blue-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {p.payoutStatus} · {p.payoutMethod}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<FileCheck2 className="w-3.5 h-3.5" />}
                            onClick={() => setCertificatePickup(p)}
                          >
                            View Receipt
                          </Button>
                          {p.payoutStatus !== 'Paid' && p.status !== 'Cancelled' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleSettlePayout(p.id)}
                            >
                              Settle Payout
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =====================================================================
          RESCHEDULE PICKUP MODAL
      ====================================================================== */}
      {reschedulingPickup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRescheduleSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-elevated space-y-4 border border-juris-border"
          >
            <div className="flex items-center justify-between border-b border-juris-border pb-3">
              <h3 className="text-base font-extrabold text-juris-textPrimary">
                Reschedule Pickup {reschedulingPickup.id}
              </h3>
              <button
                type="button"
                onClick={() => setReschedulingPickup(null)}
                className="text-juris-textMuted hover:text-juris-textPrimary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-juris-textPrimary">New Date</label>
                <Input
                  value={newRescheduleDate}
                  onChange={(e) => setNewRescheduleDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-juris-textPrimary">New Time Slot</label>
                <select
                  value={newRescheduleSlot}
                  onChange={(e) => setNewRescheduleSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-juris-border bg-white font-semibold text-sm"
                >
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setReschedulingPickup(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save New Slot
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          DIGITAL RECYCLING RECEIPT MODAL
      ====================================================================== */}
      {certificatePickup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-elevated space-y-5 border border-juris-border">
            <div className="flex items-center justify-between border-b border-juris-border pb-3">
              <div className="flex items-center gap-2.5">
                <ElectroFineLogo size="sm" showText={false} />
                <div>
                  <h3 className="text-base font-extrabold text-juris-textPrimary">
                    Digital Recycling Receipt
                  </h3>
                  <p className="text-[11px] text-juris-textMuted">
                    Verified e-waste collection & fair valuation record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCertificatePickup(null)}
                className="text-juris-textMuted hover:text-juris-textPrimary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs tabular-nums">
              <div className="p-4 rounded-xl bg-[#009150] text-white space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A7F3D0] font-mono font-bold">
                    Receipt ID: {certificatePickup.verificationProof?.digitalReceiptHash}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white text-[#009150] font-extrabold text-[11px]">
                    {certificatePickup.payoutStatus}
                  </span>
                </div>
                <p className="text-sm font-extrabold pt-0.5">
                  Pickup {certificatePickup.id} · {certificatePickup.userName}
                </p>
                <p className="text-xs text-white/85">{certificatePickup.address}</p>
              </div>

              <div className="space-y-1.5 border-b border-juris-border pb-3">
                <p className="font-bold text-juris-textPrimary">Recycled Items:</p>
                {certificatePickup.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-juris-textBody">
                    <span>
                      {it.quantity}x {it.deviceName} ({it.condition})
                    </span>
                    <span className="font-mono font-bold">
                      {it.verifiedWeightKg ?? it.approxWeightKg} kg
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 border-b border-juris-border pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-juris-textPrimary">Final Payout Amount</span>
                  <span className="text-base font-extrabold text-[#009150]">
                    ₹{certificatePickup.quote.finalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="font-mono text-xs text-juris-textMuted">
                  Formula: {certificatePickup.quote.formulaString}
                </p>
                <p className="text-juris-textMuted text-xs pt-0.5">
                  Payout Method: <strong>{certificatePickup.payoutMethod}</strong>
                </p>
              </div>

              <div className="space-y-1 text-juris-textMuted">
                <p>
                  Verified By: <strong className="text-juris-textPrimary">{certificatePickup.verificationProof?.verifiedBy}</strong> ({certificatePickup.verificationProof?.verifiedAt})
                </p>
                <p>
                  CO₂ Avoided: <strong className="text-[#009150]">{certificatePickup.quote.co2AvoidedKg} kg</strong> · Notes: {certificatePickup.verificationProof?.notes}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
              <div className="flex items-center gap-2">
                {certificatePickup.payoutStatus !== 'Paid' &&
                  certificatePickup.status !== 'Cancelled' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSettlePayout(certificatePickup.id)}
                    >
                      Settle Payout Now
                    </Button>
                  )}
                <Button variant="primary" size="sm" onClick={() => setCertificatePickup(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
