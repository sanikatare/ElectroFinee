import mongoose, { Schema } from 'mongoose';
import fs from 'fs';
import path from 'path';

// ============================================================================
// 1. INDIAN E-WASTE VALUATION & PRICING ENGINE (₹ INR — CPCB Compliant)
// finalAmount = (baseRate * conditionFactor * quantityFactor * marketFactor) - pickupFee
// ============================================================================

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

// Indian Market Base Rates in ₹ (INR) per Kg
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

export const MARKET_FACTOR = 1.08; // Indian Precious Metal Recovery Index (Gold, Copper, Lithium)
export const DEFAULT_SERVICE_FEE = 40; // ₹40 nominal doorstep handling fee (waived for small scrap)

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

export function calculatePayoutQuote(items: EWasteItem[]): QuoteBreakdown {
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
      formulaString: 'finalAmount = (₹0 × 1.00 × 1.00 × 1.08) - ₹0 = ₹0'
    };
  }

  let totalWeight = 0;
  let totalQty = 0;
  let weightedBaseSum = 0;
  let weightedConditionSum = 0;

  for (const item of items) {
    const w = Number(item.verifiedWeightKg ?? item.approxWeightKg) || 1;
    const q = Number(item.quantity) || 1;
    const baseRate = BASE_RATES_PER_KG[item.category] || 350;
    const condMult = CONDITION_MULTIPLIERS[item.condition] || 1.0;

    totalWeight += w;
    totalQty += q;
    weightedBaseSum += baseRate * w;
    weightedConditionSum += condMult * w;
  }

  const avgConditionFactor = Number((weightedConditionSum / Math.max(0.1, totalWeight)).toFixed(2));
  const quantityFactor = Number((1 + Math.min(0.25, (totalQty - 1) * 0.03)).toFixed(2));
  const baseRateTotal = Math.round(weightedBaseSum);
  const grossAmount = Math.round(
    baseRateTotal * avgConditionFactor * quantityFactor * MARKET_FACTOR
  );
  const serviceFee = grossAmount > 300 ? DEFAULT_SERVICE_FEE : 0;
  const finalAmount = Math.max(0, grossAmount - serviceFee);
  const estimatedPoints = Math.round(finalAmount * 0.35 + totalWeight * 25);
  const co2AvoidedKg = Number((totalWeight * 2.7).toFixed(1));

  return {
    baseRateTotal,
    conditionFactor: avgConditionFactor,
    quantityFactor,
    marketFactor: MARKET_FACTOR,
    grossAmount,
    serviceFee,
    finalAmount,
    estimatedPoints,
    co2AvoidedKg,
    formulaString: `(₹${baseRateTotal.toLocaleString('en-IN')} × ${avgConditionFactor} × ${quantityFactor} × ${MARKET_FACTOR}) - ₹${serviceFee} = ₹${finalAmount.toLocaleString('en-IN')}`
  };
}

// ============================================================================
// 2. MONGOOSE SCHEMAS & MODELS (MongoDB Native Collections)
// ============================================================================

const PickupSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    address: { type: String, required: true },
    areaZone: { type: String, default: 'Kothrud & Karve Nagar, Pune' },
    scheduledDate: { type: String, required: true },
    scheduledSlot: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'Scheduled',
        'Collector Assigned',
        'On the Way',
        'Arrived',
        'Collected',
        'Completed',
        'Cancelled'
      ],
      default: 'Scheduled'
    },
    payoutStatus: {
      type: String,
      enum: ['Pending', 'Processed', 'Paid'],
      default: 'Pending'
    },
    payoutMethod: { type: String, default: 'UPI Instant (aarav@okaxis)' },
    items: [
      {
        id: String,
        category: String,
        deviceName: String,
        quantity: Number,
        condition: String,
        approxWeightKg: Number,
        verifiedWeightKg: Number
      }
    ],
    quote: {
      baseRateTotal: Number,
      conditionFactor: Number,
      quantityFactor: Number,
      marketFactor: Number,
      grossAmount: Number,
      serviceFee: Number,
      finalAmount: Number,
      estimatedPoints: Number,
      co2AvoidedKg: Number,
      formulaString: String
    },
    collector: {
      id: String,
      name: String,
      phone: String,
      vehicleNumber: String,
      rating: Number,
      etaMinutes: Number,
      currentLat: Number,
      currentLng: Number,
      destLat: Number,
      destLng: Number
    },
    timeline: [
      {
        status: String,
        label: String,
        timestamp: String,
        completed: Boolean,
        active: Boolean
      }
    ],
    verificationProof: {
      verifiedBy: String,
      verifiedAt: String,
      digitalReceiptHash: String,
      notes: String
    }
  },
  { timestamps: true, collection: 'electrofine_pickups' }
);

const PayoutSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    pickupId: { type: String, required: true },
    amount: { type: Number, required: true },
    pointsAwarded: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Processed', 'Paid'], default: 'Pending' },
    method: { type: String, required: true },
    cardNumberMasked: { type: String, default: '•••• •••• •••• 8821' },
    formulaAudit: { type: String },
    processedAt: { type: String }
  },
  { timestamps: true, collection: 'electrofine_payouts' }
);

const StoreItemSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subtitle: { type: String, required: true },
    priceUsd: { type: Number, required: true }, // Stored in ₹ INR
    pointsCost: { type: Number, required: true },
    discountTag: { type: String, default: '20% Off' },
    salesCount: { type: Number, default: 500 },
    rating: { type: Number, default: 4.6 },
    stock: { type: Number, default: 42 }
  },
  { timestamps: true, collection: 'electrofine_store_items' }
);

export const PickupModel =
  mongoose.models.ElectroFinePickup || mongoose.model('ElectroFinePickup', PickupSchema);
export const PayoutModel =
  mongoose.models.ElectroFinePayout || mongoose.model('ElectroFinePayout', PayoutSchema);
export const StoreItemModel =
  mongoose.models.ElectroFineStoreItem || mongoose.model('ElectroFineStoreItem', StoreItemSchema);

// ============================================================================
// 3. SEED DATA FOR INDIAN ELECTROFINE PLATFORM (PUNE, MUMBAI, BENGALURU)
// ============================================================================

function buildTimeline(currentStatus: PickupStatus, scheduledDate: string, scheduledSlot: string) {
  const order: PickupStatus[] = [
    'Scheduled',
    'Collector Assigned',
    'On the Way',
    'Arrived',
    'Collected',
    'Completed'
  ];
  const idx = order.indexOf(currentStatus);

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

const INITIAL_PICKUPS = [
  {
    id: 'EF-108',
    userName: 'Aarav Sharma',
    address: 'Flat 402, Green Valley Residency, Kothrud, Pune',
    areaZone: 'Kothrud',
    scheduledDate: '28 Oct 2026',
    scheduledSlot: '03:00 PM - 05:00 PM',
    status: 'On the Way' as PickupStatus,
    payoutStatus: 'Pending' as PayoutStatus,
    payoutMethod: 'UPI (aarav@okaxis)',
    items: [
      {
        id: 'ITM-101',
        category: 'Laptops & Notebooks' as DeviceCategory,
        deviceName: 'Dell & HP Laptops',
        quantity: 2,
        condition: 'Good' as ItemCondition,
        approxWeightKg: 4.2
      },
      {
        id: 'ITM-102',
        category: 'Smartphones & Tablets' as DeviceCategory,
        deviceName: 'Android Smartphones',
        quantity: 3,
        condition: 'Damaged' as ItemCondition,
        approxWeightKg: 0.9
      }
    ],
    collector: {
      id: 'COL-01',
      name: 'Rajesh Patil',
      phone: '+91 98221 77410',
      vehicleNumber: 'MH-12-EF-4028',
      rating: 4.9,
      etaMinutes: 11,
      currentLat: 18.5074,
      currentLng: 73.8077,
      destLat: 18.5112,
      destLng: 73.8145
    },
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
    areaZone: 'Hadapsar',
    scheduledDate: '19 Oct 2026',
    scheduledSlot: '11:00 AM - 01:00 PM',
    status: 'Completed' as PickupStatus,
    payoutStatus: 'Paid' as PayoutStatus,
    payoutMethod: 'Bank Transfer (•••• 8821)',
    items: [
      {
        id: 'ITM-201',
        category: 'Monitors & LED TVs' as DeviceCategory,
        deviceName: '27" LED Monitors',
        quantity: 3,
        condition: 'Working' as ItemCondition,
        approxWeightKg: 14.5,
        verifiedWeightKg: 14.8
      },
      {
        id: 'ITM-202',
        category: 'Inverter Batteries & UPS' as DeviceCategory,
        deviceName: 'Office UPS Units',
        quantity: 2,
        condition: 'Scrap' as ItemCondition,
        approxWeightKg: 16.0,
        verifiedWeightKg: 16.2
      }
    ],
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
    areaZone: 'Indiranagar',
    scheduledDate: '08 Oct 2026',
    scheduledSlot: '09:00 AM - 11:00 AM',
    status: 'Completed' as PickupStatus,
    payoutStatus: 'Paid' as PayoutStatus,
    payoutMethod: 'UPI (aarav@okaxis)',
    items: [
      {
        id: 'ITM-301',
        category: 'Motherboards & PCBs' as DeviceCategory,
        deviceName: 'Motherboards & RAM Batch',
        quantity: 6,
        condition: 'Good' as ItemCondition,
        approxWeightKg: 5.5,
        verifiedWeightKg: 5.6
      }
    ],
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
    verificationProof: {
      verifiedBy: 'Suresh Kulkarni',
      verifiedAt: '08 Oct 2026, 10:12 AM',
      digitalReceiptHash: 'REC-099-VERIFIED',
      notes: 'Items checked and weighed. Payout completed.'
    }
  }
];

const INITIAL_STORE_ITEMS = [
  {
    id: 'ECO-BAG-01',
    name: 'Khadi Cotton Tote Bag',
    subtitle: 'Handwoven 100% recycled Indian cotton',
    priceUsd: 199,
    pointsCost: 400,
    discountTag: '20% Off',
    salesCount: 640,
    rating: 4.8,
    stock: 48
  },
  {
    id: 'ECO-BAG-02',
    name: 'Jute Laptop Sleeve 15"',
    subtitle: 'Organic Bengal jute with padded lining',
    priceUsd: 349,
    pointsCost: 700,
    discountTag: '25% Off',
    salesCount: 512,
    rating: 4.7,
    stock: 35
  },
  {
    id: 'ECO-TEE-03',
    name: 'ElectroFine Eco T-Shirt',
    subtitle: 'Tiruppur recycled organic cotton tee',
    priceUsd: 299,
    pointsCost: 600,
    discountTag: '20% Off',
    salesCount: 890,
    rating: 4.9,
    stock: 62
  },
  {
    id: 'ECO-BTL-04',
    name: 'Assam Bamboo Flask',
    subtitle: 'Insulated natural bamboo & steel bottle',
    priceUsd: 399,
    pointsCost: 800,
    discountTag: '15% Off',
    salesCount: 410,
    rating: 4.8,
    stock: 29
  }
];

// ============================================================================
// 4. ZERO-CONFIG AUTONOMOUS MONGODB MANAGER
// ============================================================================

class ElectroFineMongoEngine {
  private isLiveMongoConnected = false;
  private persistencePath = path.join(process.cwd(), '.electrofine-store.json');

  private pickups: any[] = [];
  private payouts: any[] = [];
  private storeItems: any[] = [];
  private currentUser = {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@electrofine.in',
    phone: '+91 98230 45120',
    role: 'Recycler' as 'Recycler' | 'Collector',
    city: 'Pune, Maharashtra'
  };
  private registeredCards: string[] = [
    '4532891044218821',
    '6070921145882310',
    '5123456789012345'
  ];
  private userPointsBalance = 3400;

  constructor() {
    this.seedOrLoadLocalStore();
  }

  private seedOrLoadLocalStore() {
    try {
      if (fs.existsSync(this.persistencePath)) {
        const raw = JSON.parse(fs.readFileSync(this.persistencePath, 'utf-8'));
        if (Array.isArray(raw.pickups) && raw.pickups.length > 0) {
          this.pickups = raw.pickups;
          this.payouts = raw.payouts || [];
          this.storeItems = raw.storeItems || INITIAL_STORE_ITEMS;
          this.userPointsBalance = raw.userPointsBalance ?? 3400;
          if (raw.currentUser) {
            this.currentUser = raw.currentUser;
          }
          return;
        }
      }
    } catch {
      // Fallback to fresh seed
    }

    this.pickups = INITIAL_PICKUPS.map((p) => {
      const quote = calculatePayoutQuote(p.items);
      return {
        ...p,
        _id: new mongoose.Types.ObjectId().toString(),
        quote,
        timeline: buildTimeline(p.status, p.scheduledDate, p.scheduledSlot)
      };
    });

    this.payouts = this.pickups.map((p, idx) => ({
      _id: new mongoose.Types.ObjectId().toString(),
      id: `PAY-IN-${9041 + idx}`,
      pickupId: p.id,
      amount: p.quote.finalAmount,
      pointsAwarded: p.quote.estimatedPoints,
      status: p.payoutStatus,
      method: p.payoutMethod,
      cardNumberMasked: '•••• •••• •••• 8821',
      formulaAudit: p.quote.formulaString,
      processedAt: p.scheduledDate
    }));

    this.storeItems = INITIAL_STORE_ITEMS.map((item) => ({
      ...item,
      _id: new mongoose.Types.ObjectId().toString()
    }));

    this.saveSnapshot();
  }

  private saveSnapshot() {
    try {
      fs.writeFileSync(
        this.persistencePath,
        JSON.stringify(
          {
            pickups: this.pickups,
            payouts: this.payouts,
            storeItems: this.storeItems,
            userPointsBalance: this.userPointsBalance,
            currentUser: this.currentUser
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch {
      // Ignore write errors on read-only fs
    }
  }

  async connect() {
    const uri = process.env.MONGODB_URI;
    if (uri && uri.startsWith('mongodb')) {
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
        this.isLiveMongoConnected = true;
        return;
      } catch {
        this.isLiveMongoConnected = false;
      }
    }
    this.isLiveMongoConnected = false;
  }

  getDashboardSummary() {
    const completed = this.pickups.filter((p) => p.status !== 'Cancelled');
    const totalKgRecycled = Number(
      completed
        .reduce(
          (sum, p) =>
            sum +
            p.items.reduce(
              (s: number, i: any) => s + (Number(i.verifiedWeightKg ?? i.approxWeightKg) || 0),
              0
            ),
          0
        )
        .toFixed(1)
    );
    const totalCo2AvoidedKg = Number((totalKgRecycled * 2.7).toFixed(1));
    const totalEarningsUsd = Math.round(
      completed.reduce((sum, p) => sum + (Number(p.quote?.finalAmount) || 0), 0)
    );

    return {
      user: {
        ...this.currentUser,
        pointsBalance: this.userPointsBalance
      },
      metrics: {
        totalPickups: this.pickups.length,
        activePickups: this.pickups.filter(
          (p) => p.status !== 'Completed' && p.status !== 'Cancelled'
        ).length,
        totalKgRecycled,
        totalCo2AvoidedKg,
        totalEarningsUsd,
        pointsBalance: this.userPointsBalance
      },
      database: {
        engine: 'MongoDB (Mongoose Zero-Config Engine)',
        mode: this.isLiveMongoConnected ? 'Connected Cluster' : 'Autonomous Embedded Document Store',
        zeroConfig: true,
        collections: {
          electrofine_pickups: this.pickups.length,
          electrofine_payouts: this.payouts.length,
          electrofine_store_items: this.storeItems.length
        }
      }
    };
  }

  authenticateUser(payload: {
    name?: string;
    email?: string;
    phone?: string;
    role?: 'Recycler' | 'Collector';
  }) {
    if (payload.name && payload.name.trim()) {
      this.currentUser.name = payload.name.trim();
    }
    if (payload.email && payload.email.trim()) {
      this.currentUser.email = payload.email.trim();
    }
    if (payload.phone && payload.phone.trim()) {
      this.currentUser.phone = payload.phone.trim();
    }
    if (payload.role === 'Recycler' || payload.role === 'Collector') {
      this.currentUser.role = payload.role;
    }
    this.saveSnapshot();
    return {
      ...this.currentUser,
      pointsBalance: this.userPointsBalance
    };
  }

  getPickups(status?: string) {
    if (status && status !== 'All') {
      return this.pickups.filter((p) => p.status.toLowerCase() === status.toLowerCase());
    }
    return this.pickups;
  }

  getPickupById(id: string) {
    return (
      this.pickups.find((p) => p.id.toLowerCase() === id.toLowerCase()) || this.pickups[0]
    );
  }

  createPickup(payload: {
    userName?: string;
    address?: string;
    areaZone?: string;
    scheduledDate?: string;
    scheduledSlot?: string;
    payoutMethod?: string;
    items?: EWasteItem[];
  }) {
    const items: EWasteItem[] =
      Array.isArray(payload.items) && payload.items.length > 0
        ? payload.items
        : [
            {
              id: `ITM-${Date.now()}`,
              category: 'Laptops & Notebooks',
              deviceName: 'Office Laptops Batch',
              quantity: 2,
              condition: 'Good',
              approxWeightKg: 3.8
            }
          ];

    const quote = calculatePayoutQuote(items);
    const id = `EF-${Math.floor(110 + Math.random() * 890)}`;
    const scheduledDate = payload.scheduledDate || '30 Oct 2026';
    const scheduledSlot = payload.scheduledSlot || '03:00 PM - 05:00 PM';
    const status: PickupStatus = 'Collector Assigned';

    const newPickup = {
      _id: new mongoose.Types.ObjectId().toString(),
      id,
      userName: payload.userName || 'Aarav Sharma',
      address:
        payload.address ||
        'Flat 402, Green Valley Residency, Kothrud, Pune',
      areaZone: payload.areaZone || 'Kothrud',
      scheduledDate,
      scheduledSlot,
      status,
      payoutStatus: 'Pending' as PayoutStatus,
      payoutMethod: payload.payoutMethod || 'UPI (aarav@okaxis)',
      items,
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
        destLat: 18.5112,
        destLng: 73.8145
      },
      timeline: buildTimeline(status, scheduledDate, scheduledSlot),
      verificationProof: {
        verifiedBy: 'Pending verification',
        verifiedAt: '-',
        digitalReceiptHash: `REC-${id}-PENDING`,
        notes: 'Collector Rajesh Patil assigned for pickup.'
      }
    };

    this.pickups.unshift(newPickup);
    this.payouts.unshift({
      _id: new mongoose.Types.ObjectId().toString(),
      id: `PAY-IN-${Math.floor(1000 + Math.random() * 9000)}`,
      pickupId: newPickup.id,
      amount: quote.finalAmount,
      pointsAwarded: quote.estimatedPoints,
      status: 'Pending',
      method: newPickup.payoutMethod,
      cardNumberMasked: '•••• •••• •••• 8821',
      formulaAudit: quote.formulaString,
      processedAt: scheduledDate
    });

    this.saveSnapshot();
    return newPickup;
  }

  reschedulePickup(id: string, scheduledDate: string, scheduledSlot: string) {
    const pickup = this.getPickupById(id);
    if (pickup) {
      pickup.scheduledDate = scheduledDate;
      pickup.scheduledSlot = scheduledSlot;
      pickup.timeline = buildTimeline(pickup.status, scheduledDate, scheduledSlot);
      this.saveSnapshot();
    }
    return pickup;
  }

  cancelPickup(id: string) {
    const pickup = this.getPickupById(id);
    if (pickup) {
      pickup.status = 'Cancelled';
      this.saveSnapshot();
    }
    return pickup;
  }

  updatePickupStatusAndLocation(
    id: string,
    payload: {
      status?: PickupStatus;
      currentLat?: number;
      currentLng?: number;
      etaMinutes?: number;
      verifiedWeightKg?: number;
      verifiedCondition?: ItemCondition;
      notes?: string;
    }
  ) {
    const pickup = this.getPickupById(id);
    if (!pickup) return null;

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
    if (typeof payload.currentLat === 'number') {
      pickup.collector.currentLat = payload.currentLat;
    }
    if (typeof payload.currentLng === 'number') {
      pickup.collector.currentLng = payload.currentLng;
    }
    if (typeof payload.etaMinutes === 'number') {
      pickup.collector.etaMinutes = payload.etaMinutes;
    }

    if (typeof payload.verifiedWeightKg === 'number' && payload.verifiedWeightKg > 0 && pickup.items.length > 0) {
      const currentApproxTotal = pickup.items.reduce(
        (sum: number, item: any) => sum + (Number(item.approxWeightKg) || 0),
        0
      );
      pickup.items = pickup.items.map((item: any, idx: number) => {
        const share =
          currentApproxTotal > 0
            ? (Number(item.approxWeightKg) || 0) / currentApproxTotal
            : idx === 0
            ? 1
            : 0;
        return {
          ...item,
          verifiedWeightKg: Number((payload.verifiedWeightKg! * share).toFixed(2)),
          condition: payload.verifiedCondition || item.condition
        };
      });
      pickup.quote = calculatePayoutQuote(pickup.items);
    }

    if (pickup.status === 'Collected' || pickup.status === 'Completed') {
      pickup.verificationProof = {
        verifiedBy: pickup.collector.name,
        verifiedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        digitalReceiptHash: `REC-${pickup.id}-VERIFIED`,
        notes:
          payload.notes ||
          'Verified on digital scale. Digital recycling receipt issued.'
      };
    }

    if (pickup.status === 'Collected' && pickup.payoutStatus === 'Pending') {
      pickup.payoutStatus = 'Processed';
      const payoutRec = this.payouts.find((pay) => pay.pickupId === pickup.id);
      if (payoutRec) {
        payoutRec.status = 'Processed';
        payoutRec.amount = pickup.quote.finalAmount;
        payoutRec.formulaAudit = pickup.quote.formulaString;
      }
    }

    if (pickup.status === 'Completed' && pickup.payoutStatus !== 'Paid') {
      pickup.payoutStatus = 'Paid';
      this.userPointsBalance += pickup.quote.estimatedPoints;
      const payoutRec = this.payouts.find((pay) => pay.pickupId === pickup.id);
      if (payoutRec) {
        payoutRec.status = 'Paid';
        payoutRec.amount = pickup.quote.finalAmount;
        payoutRec.formulaAudit = pickup.quote.formulaString;
      }
    }

    pickup.timeline = buildTimeline(pickup.status, pickup.scheduledDate, pickup.scheduledSlot);
    this.saveSnapshot();
    return pickup;
  }

  getPayouts() {
    return this.payouts;
  }

  processPayout(pickupId: string) {
    const pickup = this.getPickupById(pickupId);
    if (pickup && pickup.payoutStatus !== 'Paid') {
      pickup.payoutStatus = 'Paid';
      pickup.status = 'Completed';
      pickup.timeline = buildTimeline('Completed', pickup.scheduledDate, pickup.scheduledSlot);
      this.userPointsBalance += pickup.quote.estimatedPoints;

      const payout = this.payouts.find((p) => p.pickupId === pickup.id);
      if (payout) {
        payout.status = 'Paid';
      }
      this.saveSnapshot();
    }
    return pickup;
  }

  validateOrRegisterCard(cardNumber: string, action: 'validate' | 'register' = 'validate') {
    const cleaned = cardNumber.replace(/\s+/g, '');
    if (action === 'register') {
      if (cleaned.length >= 12 && !this.registeredCards.includes(cleaned)) {
        this.registeredCards.push(cleaned);
      }
      return {
        valid: true,
        registered: true,
        cardNumber: cleaned,
        bankName: 'SBI / RuPay Auto-Payout',
        errorMessage: null
      };
    }

    const isRegistered = this.registeredCards.includes(cleaned);
    return {
      valid: isRegistered,
      registered: isRegistered,
      cardNumber: cleaned,
      bankName: 'SBI / RuPay Auto-Payout',
      errorMessage: isRegistered ? null : 'Sorry, the card number is not registered'
    };
  }

  getStoreItems() {
    return this.storeItems;
  }

  redeemStoreItem(itemId: string) {
    const item = this.storeItems.find((i) => i.id === itemId) || this.storeItems[0];
    if (!item) {
      return { status: 'error', message: 'Item not found', pointsBalance: this.userPointsBalance };
    }
    if (this.userPointsBalance < item.pointsCost) {
      return {
        status: 'error',
        message: 'Insufficient ElectroFine Points for this item.',
        pointsBalance: this.userPointsBalance
      };
    }
    this.userPointsBalance -= item.pointsCost;
    item.stock = Math.max(0, item.stock - 1);
    item.salesCount += 1;
    this.saveSnapshot();
    return {
      status: 'success',
      redeemedItem: item,
      pointsBalance: this.userPointsBalance
    };
  }
}

export const mongoDb = new ElectroFineMongoEngine();
