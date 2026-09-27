/**
 * ElectroFine Frontend API Client — Smart E-Waste Pickups, Live Collector Tracking & Fair Payouts
 * Works seamlessly with the Express + MongoDB backend (/api/*) AND includes a full
 * client-side persistence fallback for static deployments (e.g. Vercel / Netlify).
 */

export type DeviceCategory =
  | 'Laptops & Notebooks'
  | 'Smartphones & Tablets'
  | 'Monitors & LED TVs'
  | 'Servers & Networking'
  | 'Inverter Batteries & UPS'
  | 'Motherboards & PCBs'
  | 'Home Appliances (AC, Fridge)';

export type ItemCondition = 'Working' | 'Good' | 'Damaged' | 'Scrap';

export type PickupStatus =
  | 'Scheduled'
  | 'Collector Assigned'
  | 'On the Way'
  | 'Arrived'
  | 'Collected'
  | 'Completed'
  | 'Cancelled';

export type PayoutStatus = 'Pending' | 'Processed' | 'Paid';

export interface EWasteItem {
  id: string;
  category: DeviceCategory;
  deviceName: string;
  quantity: number;
  condition: ItemCondition;
  approxWeightKg: number;
  verifiedWeightKg?: number;
}

export interface QuoteBreakdown {
  baseRateTotal: number;
  conditionFactor: number;
  quantityFactor: number;
  marketFactor: number;
  grossAmount: number;
  serviceFee: number;
  finalAmount: number;
  estimatedPoints: number;
  co2AvoidedKg: number;
  formulaString: string;
}

export interface PickupRecord {
  _id?: string;
  id: string;
  userName: string;
  address: string;
  areaZone: string;
  scheduledDate: string;
  scheduledSlot: string;
  status: PickupStatus;
  payoutStatus: PayoutStatus;
  payoutMethod: string;
  items: EWasteItem[];
  quote: QuoteBreakdown;
  collector: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
    rating: number;
    etaMinutes: number;
    currentLat: number;
    currentLng: number;
    destLat: number;
    destLng: number;
  };
  timeline: Array<{
    status: string;
    label: string;
    timestamp: string;
    completed: boolean;
    active: boolean;
  }>;
  verificationProof: {
    verifiedBy: string;
    verifiedAt: string;
    digitalReceiptHash: string;
    notes: string;
  };
}

export interface PayoutRecord {
  id: string;
  pickupId: string;
  amount: number;
  pointsAwarded: number;
  status: PayoutStatus;
  method: string;
  cardNumberMasked: string;
  formulaAudit: string;
  processedAt: string;
}

export interface StoreItem {
  id: string;
  name: string;
  subtitle: string;
  priceUsd: number;
  pointsCost: number;
  discountTag: string;
  salesCount: number;
  rating: number;
  stock: number;
}

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  'Laptops & Notebooks',
  'Smartphones & Tablets',
  'Monitors & LED TVs',
  'Servers & Networking',
  'Inverter Batteries & UPS',
  'Motherboards & PCBs',
  'Home Appliances (AC, Fridge)'
];

export const ITEM_CONDITIONS: ItemCondition[] = ['Working', 'Good', 'Damaged', 'Scrap'];

export const BASE_RATES_PER_KG: Record<DeviceCategory, number> = {
  'Laptops & Notebooks': 650,
  'Smartphones & Tablets': 1200,
  'Monitors & LED TVs': 220,
  'Servers & Networking': 750,
  'Inverter Batteries & UPS': 280,
  'Motherboards & PCBs': 1450,
  'Home Appliances (AC, Fridge)': 160
};

export const CONDITION_MULTIPLIERS: Record<ItemCondition, number> = {
  Working: 1.35,
  Good: 1.15,
  Damaged: 0.85,
  Scrap: 0.65
};

const MARKET_FACTOR = 1.05;
const DEFAULT_SERVICE_FEE = 120;

export function calculateClientQuote(items: EWasteItem[], serviceFee = DEFAULT_SERVICE_FEE): QuoteBreakdown {
  if (!items || items.length === 0) {
    return {
      baseRateTotal: 0,
      conditionFactor: 1,
      quantityFactor: 1,
      marketFactor: MARKET_FACTOR,
      grossAmount: 0,
      serviceFee: 0,
      finalAmount: 0,
      estimatedPoints: 0,
      co2AvoidedKg: 0,
      formulaString: '(₹0 × 1.00 × 1.00 × 1.05) - ₹0 = ₹0'
    };
  }

  let baseRateTotal = 0;
  let weightedConditionSum = 0;
  let totalWeightKg = 0;
  let totalUnits = 0;

  for (const item of items) {
    const weight = Number(item.verifiedWeightKg ?? item.approxWeightKg) || 1;
    const qty = Math.max(1, Number(item.quantity) || 1);
    const rate = BASE_RATES_PER_KG[item.category] || 350;
    const condMult = CONDITION_MULTIPLIERS[item.condition] || 1.0;

    const itemBase = rate * weight;
    baseRateTotal += itemBase;
    weightedConditionSum += itemBase * condMult;
    totalWeightKg += weight;
    totalUnits += qty;
  }

  baseRateTotal = Math.round(baseRateTotal);
  const conditionFactor =
    baseRateTotal > 0 ? Number((weightedConditionSum / baseRateTotal).toFixed(2)) : 1.0;
  const quantityFactor =
    totalWeightKg >= 20 || totalUnits >= 8
      ? 1.12
      : totalWeightKg >= 8 || totalUnits >= 4
      ? 1.06
      : 1.0;

  const grossAmount = Math.round(
    baseRateTotal * conditionFactor * quantityFactor * MARKET_FACTOR
  );
  const appliedFee = grossAmount > serviceFee ? serviceFee : 0;
  const finalAmount = Math.max(100, grossAmount - appliedFee);
  const estimatedPoints = Math.round(finalAmount * 0.5);
  const co2AvoidedKg = Number((totalWeightKg * 2.7).toFixed(1));
  const formulaString = `(₹${baseRateTotal.toLocaleString('en-IN')} × ${conditionFactor} × ${quantityFactor} × ${MARKET_FACTOR}) - ₹${appliedFee} = ₹${finalAmount.toLocaleString('en-IN')}`;

  return {
    baseRateTotal,
    conditionFactor,
    quantityFactor,
    marketFactor: MARKET_FACTOR,
    grossAmount,
    serviceFee: appliedFee,
    finalAmount,
    estimatedPoints,
    co2AvoidedKg,
    formulaString
  };
}

function buildClientTimeline(status: PickupStatus, scheduledDate: string, scheduledSlot: string) {
  const order: PickupStatus[] = [
    'Scheduled',
    'Collector Assigned',
    'On the Way',
    'Arrived',
    'Collected',
    'Completed'
  ];
  const idx = status === 'Cancelled' ? -1 : order.indexOf(status);

  return [
    {
      status: 'Scheduled',
      label: 'Scheduled',
      timestamp: `${scheduledDate} · ${scheduledSlot}`,
      completed: idx >= 0,
      active: idx === 0
    },
    {
      status: 'Collector Assigned',
      label: 'Collector Assigned',
      timestamp: idx >= 1 ? 'Collector assigned to route' : 'Awaiting assignment',
      completed: idx >= 1,
      active: idx === 1
    },
    {
      status: 'On the Way',
      label: 'On the Way',
      timestamp: idx >= 2 ? 'Live tracking active' : 'Pending dispatch',
      completed: idx >= 2,
      active: idx === 2
    },
    {
      status: 'Arrived',
      label: 'Arrived at Location',
      timestamp: idx >= 3 ? 'Collector at pickup address' : 'Pending arrival',
      completed: idx >= 3,
      active: idx === 3
    },
    {
      status: 'Collected',
      label: 'Collected & Verified',
      timestamp: idx >= 4 ? 'Items checked and weighed' : 'Pending verification',
      completed: idx >= 4,
      active: idx === 4
    },
    {
      status: 'Completed',
      label: 'Completed & Paid',
      timestamp: idx >= 5 ? 'Payout settled & digital receipt issued' : 'Pending completion',
      completed: idx >= 5,
      active: idx === 5
    }
  ];
}

const STORAGE_KEY = 'electrofine_client_store_v1';

function getFallbackStore(): { pickups: PickupRecord[]; user: any } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.pickups) && parsed.pickups.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  const seedPickups: PickupRecord[] = [
    {
      id: 'EF-108',
      userName: 'Aarav Sharma',
      address: 'Flat 402, Green Valley Residency, Kothrud, Pune',
      areaZone: 'Kothrud, Pune',
      scheduledDate: '28 Oct 2026',
      scheduledSlot: '03:00 PM - 05:00 PM',
      status: 'On the Way',
      payoutStatus: 'Pending',
      payoutMethod: 'UPI (aarav@okaxis)',
      items: [
        {
          id: 'ITM-101',
          category: 'Laptops & Notebooks',
          deviceName: 'Dell & HP Laptops',
          quantity: 2,
          condition: 'Good',
          approxWeightKg: 4.2
        },
        {
          id: 'ITM-102',
          category: 'Smartphones & Tablets',
          deviceName: 'Android Smartphones',
          quantity: 3,
          condition: 'Damaged',
          approxWeightKg: 0.9
        }
      ],
      quote: calculateClientQuote([
        {
          id: 'ITM-101',
          category: 'Laptops & Notebooks',
          deviceName: 'Dell & HP Laptops',
          quantity: 2,
          condition: 'Good',
          approxWeightKg: 4.2
        },
        {
          id: 'ITM-102',
          category: 'Smartphones & Tablets',
          deviceName: 'Android Smartphones',
          quantity: 3,
          condition: 'Damaged',
          approxWeightKg: 0.9
        }
      ]),
      collector: {
        id: 'COL-01',
        name: 'Rajesh Patil',
        phone: '+91 98221 77410',
        vehicleNumber: 'MH-12-EF-4028',
        rating: 4.9,
        etaMinutes: 11,
        currentLat: 18.5074,
        currentLng: 73.8077,
        destLat: 18.5108,
        destLng: 73.8145
      },
      timeline: buildClientTimeline('On the Way', '28 Oct 2026', '03:00 PM - 05:00 PM'),
      verificationProof: {
        verifiedBy: 'Pending verification',
        verifiedAt: '-',
        digitalReceiptHash: 'REC-108-PENDING',
        notes: 'Collector Rajesh Patil is on the way.'
      }
    },
    {
      id: 'EF-104',
      userName: 'Aarav Sharma',
      address: 'Tower B, Cybercity Magarpatta, Hadapsar, Pune',
      areaZone: 'Hadapsar, Pune',
      scheduledDate: '19 Oct 2026',
      scheduledSlot: '11:00 AM - 01:00 PM',
      status: 'Completed',
      payoutStatus: 'Paid',
      payoutMethod: 'Bank Transfer (•••• 8821)',
      items: [
        {
          id: 'ITM-201',
          category: 'Monitors & LED TVs',
          deviceName: '27" LED Monitors',
          quantity: 3,
          condition: 'Working',
          approxWeightKg: 14.5,
          verifiedWeightKg: 15.0
        },
        {
          id: 'ITM-202',
          category: 'Inverter Batteries & UPS',
          deviceName: 'Office UPS Units',
          quantity: 2,
          condition: 'Scrap',
          approxWeightKg: 16.0,
          verifiedWeightKg: 16.0
        }
      ],
      quote: calculateClientQuote([
        {
          id: 'ITM-201',
          category: 'Monitors & LED TVs',
          deviceName: '27" LED Monitors',
          quantity: 3,
          condition: 'Working',
          approxWeightKg: 14.5,
          verifiedWeightKg: 15.0
        },
        {
          id: 'ITM-202',
          category: 'Inverter Batteries & UPS',
          deviceName: 'Office UPS Units',
          quantity: 2,
          condition: 'Scrap',
          approxWeightKg: 16.0,
          verifiedWeightKg: 16.0
        }
      ]),
      collector: {
        id: 'COL-02',
        name: 'Vikram Deshmukh',
        phone: '+91 97654 31900',
        vehicleNumber: 'MH-12-EF-1904',
        rating: 4.8,
        etaMinutes: 0,
        currentLat: 18.5158,
        currentLng: 73.9272,
        destLat: 18.5158,
        destLng: 73.9272
      },
      timeline: buildClientTimeline('Completed', '19 Oct 2026', '11:00 AM - 01:00 PM'),
      verificationProof: {
        verifiedBy: 'Vikram Deshmukh',
        verifiedAt: '19 Oct 2026, 12:18 PM',
        digitalReceiptHash: 'REC-104-VERIFIED',
        notes: 'Items checked and weighed on digital scale.'
      }
    },
    {
      id: 'EF-099',
      userName: 'Aarav Sharma',
      address: '100 Feet Road, Indiranagar, Bengaluru',
      areaZone: 'Indiranagar, Bengaluru',
      scheduledDate: '08 Oct 2026',
      scheduledSlot: '09:00 AM - 11:00 AM',
      status: 'Completed',
      payoutStatus: 'Paid',
      payoutMethod: 'UPI (aarav@okaxis)',
      items: [
        {
          id: 'ITM-301',
          category: 'Motherboards & PCBs',
          deviceName: 'Motherboards & RAM Batch',
          quantity: 6,
          condition: 'Good',
          approxWeightKg: 5.5,
          verifiedWeightKg: 5.5
        }
      ],
      quote: calculateClientQuote([
        {
          id: 'ITM-301',
          category: 'Motherboards & PCBs',
          deviceName: 'Motherboards & RAM Batch',
          quantity: 6,
          condition: 'Good',
          approxWeightKg: 5.5,
          verifiedWeightKg: 5.5
        }
      ]),
      collector: {
        id: 'COL-03',
        name: 'Suresh Kulkarni',
        phone: '+91 98902 65112',
        vehicleNumber: 'KA-01-EF-8821',
        rating: 5.0,
        etaMinutes: 0,
        currentLat: 12.9784,
        currentLng: 77.6408,
        destLat: 12.9784,
        destLng: 77.6408
      },
      timeline: buildClientTimeline('Completed', '08 Oct 2026', '09:00 AM - 11:00 AM'),
      verificationProof: {
        verifiedBy: 'Suresh Kulkarni',
        verifiedAt: '08 Oct 2026, 10:12 AM',
        digitalReceiptHash: 'REC-099-VERIFIED',
        notes: 'Items checked and weighed. Payout completed.'
      }
    }
  ];

  const initial = {
    pickups: seedPickups,
    user: {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@electrofine.in',
      phone: '+91 98230 45120',
      role: 'Recycler',
      pointsBalance: 3400
    }
  };
  saveFallbackStore(initial);
  return initial;
}

function saveFallbackStore(store: { pickups: PickupRecord[]; user: any }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

async function safeJsonFetch(url: string, options?: RequestInit): Promise<any | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

export const electrofineApi = {
  async login(payload: {
    email: string;
    phone?: string;
    role?: 'Recycler' | 'Collector';
  }) {
    const data = await safeJsonFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (data) return data;

    const store = getFallbackStore();
    store.user = {
      ...store.user,
      email: payload.email || store.user.email,
      phone: payload.phone || store.user.phone,
      role: payload.role || store.user.role
    };
    saveFallbackStore(store);
    return { status: 'success', user: store.user };
  },

  async register(payload: {
    name: string;
    email: string;
    phone?: string;
    role?: 'Recycler' | 'Collector';
  }) {
    const data = await safeJsonFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (data) return data;

    const store = getFallbackStore();
    store.user = {
      ...store.user,
      name: payload.name || store.user.name,
      email: payload.email || store.user.email,
      phone: payload.phone || store.user.phone,
      role: payload.role || store.user.role
    };
    saveFallbackStore(store);
    return { status: 'success', user: store.user };
  },

  async getDashboardSummary() {
    const data = await safeJsonFetch('/api/dashboard/summary');
    if (data) return data;

    const store = getFallbackStore();
    const activeList = store.pickups.filter((p) => p.status !== 'Cancelled');
    const totalKgRecycled = Number(
      activeList
        .reduce(
          (sum, p) =>
            sum +
            p.items.reduce(
              (s, i) => s + (Number(i.verifiedWeightKg ?? i.approxWeightKg) || 0),
              0
            ),
          0
        )
        .toFixed(1)
    );
    const totalCo2AvoidedKg = Number((totalKgRecycled * 2.7).toFixed(1));
    const totalEarningsUsd = Math.round(
      activeList.reduce((sum, p) => sum + (Number(p.quote?.finalAmount) || 0), 0)
    );

    return {
      status: 'success',
      user: store.user,
      metrics: {
        totalPickups: store.pickups.length,
        activePickups: store.pickups.filter(
          (p) => p.status !== 'Completed' && p.status !== 'Cancelled'
        ).length,
        totalKgRecycled,
        totalCo2AvoidedKg,
        totalEarningsUsd,
        pointsBalance: store.user.pointsBalance || 3400
      }
    };
  },

  async getPickups(status?: string): Promise<PickupRecord[]> {
    const url =
      status && status !== 'All'
        ? `/api/pickups?status=${encodeURIComponent(status)}`
        : '/api/pickups';
    const data = await safeJsonFetch(url);
    if (data?.pickups) return data.pickups;

    const store = getFallbackStore();
    if (status && status !== 'All') {
      return store.pickups.filter((p) => p.status.toLowerCase() === status.toLowerCase());
    }
    return store.pickups;
  },

  async getPickupById(id: string): Promise<PickupRecord> {
    const data = await safeJsonFetch(`/api/pickups/${encodeURIComponent(id)}`);
    if (data?.pickup) return data.pickup;

    const store = getFallbackStore();
    return store.pickups.find((p) => p.id === id) || store.pickups[0];
  },

  async createPickup(payload: {
    userName?: string;
    address: string;
    areaZone?: string;
    scheduledDate: string;
    scheduledSlot: string;
    payoutMethod?: string;
    items: EWasteItem[];
  }): Promise<PickupRecord> {
    const data = await safeJsonFetch('/api/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (data?.pickup) return data.pickup;

    const store = getFallbackStore();
    const id = `EF-${Math.floor(110 + Math.random() * 890)}`;
    const quote = calculateClientQuote(payload.items);
    const newPickup: PickupRecord = {
      id,
      userName: payload.userName || store.user.name || 'Aarav Sharma',
      address: payload.address,
      areaZone: payload.areaZone || 'Kothrud, Pune',
      scheduledDate: payload.scheduledDate,
      scheduledSlot: payload.scheduledSlot,
      status: 'Collector Assigned',
      payoutStatus: 'Pending',
      payoutMethod: payload.payoutMethod || 'UPI (aarav@okaxis)',
      items: payload.items,
      quote,
      collector: {
        id: 'COL-01',
        name: 'Rajesh Patil',
        phone: '+91 98221 77410',
        vehicleNumber: 'MH-12-EF-4028',
        rating: 4.9,
        etaMinutes: 14,
        currentLat: 18.5074,
        currentLng: 73.8077,
        destLat: 18.5108,
        destLng: 73.8145
      },
      timeline: buildClientTimeline(
        'Collector Assigned',
        payload.scheduledDate,
        payload.scheduledSlot
      ),
      verificationProof: {
        verifiedBy: 'Pending verification',
        verifiedAt: '-',
        digitalReceiptHash: `REC-${id}-PENDING`,
        notes: 'Collector Rajesh Patil assigned for pickup.'
      }
    };
    store.pickups.unshift(newPickup);
    saveFallbackStore(store);
    return newPickup;
  },

  async reschedulePickup(
    id: string,
    scheduledDate: string,
    scheduledSlot: string
  ): Promise<PickupRecord> {
    const data = await safeJsonFetch(`/api/pickups/${encodeURIComponent(id)}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledDate, scheduledSlot })
    });
    if (data?.pickup) return data.pickup;

    const store = getFallbackStore();
    const pickup = store.pickups.find((p) => p.id === id) || store.pickups[0];
    if (pickup) {
      pickup.scheduledDate = scheduledDate;
      pickup.scheduledSlot = scheduledSlot;
      pickup.timeline = buildClientTimeline(pickup.status, scheduledDate, scheduledSlot);
      saveFallbackStore(store);
    }
    return pickup;
  },

  async cancelPickup(id: string): Promise<PickupRecord> {
    const data = await safeJsonFetch(`/api/pickups/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH'
    });
    if (data?.pickup) return data.pickup;

    const store = getFallbackStore();
    const pickup = store.pickups.find((p) => p.id === id) || store.pickups[0];
    if (pickup) {
      pickup.status = 'Cancelled';
      saveFallbackStore(store);
    }
    return pickup;
  },

  async updateTracking(
    pickupId: string,
    payload: {
      status?: PickupStatus;
      currentLat?: number;
      currentLng?: number;
      etaMinutes?: number;
      verifiedWeightKg?: number;
      verifiedCondition?: ItemCondition;
      notes?: string;
    }
  ): Promise<PickupRecord> {
    const data = await safeJsonFetch(`/api/tracking/${encodeURIComponent(pickupId)}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (data?.pickup) return data.pickup;

    const store = getFallbackStore();
    const pickup = store.pickups.find((p) => p.id === pickupId) || store.pickups[0];
    if (pickup) {
      if (payload.status) {
        pickup.status = payload.status;
        if (payload.status === 'Scheduled') pickup.collector.etaMinutes = 20;
        if (payload.status === 'Collector Assigned') pickup.collector.etaMinutes = 15;
        if (payload.status === 'On the Way' && typeof payload.etaMinutes !== 'number') {
          pickup.collector.etaMinutes = 11;
        }
        if (
          payload.status === 'Arrived' ||
          payload.status === 'Collected' ||
          payload.status === 'Completed'
        ) {
          pickup.collector.etaMinutes = 0;
          pickup.collector.currentLat = pickup.collector.destLat;
          pickup.collector.currentLng = pickup.collector.destLng;
        }
      }
      if (typeof payload.currentLat === 'number') pickup.collector.currentLat = payload.currentLat;
      if (typeof payload.currentLng === 'number') pickup.collector.currentLng = payload.currentLng;
      if (typeof payload.etaMinutes === 'number') pickup.collector.etaMinutes = payload.etaMinutes;

      if (typeof payload.verifiedWeightKg === 'number' && payload.verifiedWeightKg > 0) {
        const approxTotal = pickup.items.reduce(
          (s, i) => s + (Number(i.approxWeightKg) || 0),
          0
        );
        pickup.items = pickup.items.map((item, idx) => {
          const share =
            approxTotal > 0
              ? (Number(item.approxWeightKg) || 0) / approxTotal
              : idx === 0
              ? 1
              : 0;
          return {
            ...item,
            verifiedWeightKg: Number((payload.verifiedWeightKg! * share).toFixed(2)),
            condition: payload.verifiedCondition || item.condition
          };
        });
        pickup.quote = calculateClientQuote(pickup.items);
      }

      if (pickup.status === 'Collected' || pickup.status === 'Completed') {
        pickup.verificationProof = {
          verifiedBy: pickup.collector.name,
          verifiedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          digitalReceiptHash: `REC-${pickup.id}-VERIFIED`,
          notes: payload.notes || 'Verified on digital scale. Digital recycling receipt issued.'
        };
      }

      if (pickup.status === 'Collected' && pickup.payoutStatus === 'Pending') {
        pickup.payoutStatus = 'Processed';
      }
      if (pickup.status === 'Completed' && pickup.payoutStatus !== 'Paid') {
        pickup.payoutStatus = 'Paid';
      }

      pickup.timeline = buildClientTimeline(
        pickup.status,
        pickup.scheduledDate,
        pickup.scheduledSlot
      );
      saveFallbackStore(store);
    }
    return pickup;
  },

  async estimatePricing(items: EWasteItem[]): Promise<QuoteBreakdown> {
    const data = await safeJsonFetch('/api/pricing/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (data?.quote) return data.quote;
    return calculateClientQuote(items);
  },

  async getPayouts(): Promise<PayoutRecord[]> {
    const data = await safeJsonFetch('/api/payouts');
    if (data?.payouts) return data.payouts;

    const store = getFallbackStore();
    return store.pickups.map((p, idx) => ({
      id: `PAY-${100 + idx}`,
      pickupId: p.id,
      amount: p.quote.finalAmount,
      pointsAwarded: p.quote.estimatedPoints,
      status: p.payoutStatus,
      method: p.payoutMethod,
      cardNumberMasked: p.payoutMethod,
      formulaAudit: p.quote.formulaString,
      processedAt: p.scheduledDate
    }));
  },

  async processPayout(pickupId: string) {
    const data = await safeJsonFetch(`/api/payouts/${encodeURIComponent(pickupId)}/process`, {
      method: 'POST'
    });
    if (data) return data;

    const store = getFallbackStore();
    const pickup = store.pickups.find((p) => p.id === pickupId) || store.pickups[0];
    if (pickup) {
      pickup.payoutStatus = 'Paid';
      pickup.status = 'Completed';
      pickup.timeline = buildClientTimeline(
        'Completed',
        pickup.scheduledDate,
        pickup.scheduledSlot
      );
      saveFallbackStore(store);
    }
    return { status: 'success', pickup };
  },

  async validateCard(cardNumber: string, action: 'validate' | 'register' = 'validate') {
    const data = await safeJsonFetch('/api/payouts/validate-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardNumber, action })
    });
    if (data) return data;
    return { valid: true, registered: true, cardNumber };
  },

  async getStoreItems(): Promise<{ items: StoreItem[]; pointsBalance: number }> {
    const data = await safeJsonFetch('/api/store/items');
    if (data) return data;
    return { items: [], pointsBalance: 3400 };
  },

  async redeemStoreItem(itemId: string) {
    const data = await safeJsonFetch('/api/store/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId })
    });
    return data || { status: 'success' };
  },

  async getDatabaseStatus() {
    const data = await safeJsonFetch('/api/v1/db/status');
    return data || { status: 'success', mode: 'Autonomous Client Store' };
  }
};
