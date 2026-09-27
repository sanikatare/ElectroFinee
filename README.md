# ElectroFine

**Schedule e-waste pickups, track your collector in real time, and get paid fairly for what you recycle.**

ElectroFine is a modern e-waste recycling platform that helps individuals and businesses dispose of electronic waste responsibly. Users can schedule pickups, monitor collector location in real time, and receive transparent, fair payouts based on recyclable value.

- **Convenient pickup scheduling**
- **Live collector tracking**
- **Transparent pricing and payouts**
- **Digitized recycling records for trust and accountability**

---

## Core Features

### 1) Smart Pickup Scheduling
- Book pickup slots based on availability and location.
- Add item details (device type, quantity, condition, approximate weight).
- Reschedule or cancel pickups within allowed windows.

### 2) Real-Time Collector Tracking
- Track assigned collectors on a live map.
- View ETA updates and status transitions:
  `Scheduled` → `Collector Assigned` → `On the Way` → `Arrived` → `Collected` → `Completed`

### 3) Fair Payout Engine
- Dynamic valuation based on:
  - Device category
  - Material recovery potential
  - Item condition (`New/Working`, `Usable`, `Damaged`, `Scrap`)
  - Current pricing bands
- Transparent quote breakdown before confirmation:
  `finalAmount = (baseRate × conditionFactor × quantityFactor × marketFactor) - serviceFee`
- Payout status tracking (`Pending` → `Processed` → `Paid`).

### 4) User Dashboard
- Pickup history and statuses
- Earnings summary & ElectroFine Points
- Recycling impact metrics (kg recycled, CO₂ avoided)

### 5) Collector Workflow
- Route-based pickup assignments
- Navigation and pickup confirmation
- Item verification and final weight/condition input
- Completion + digital proof capture

---

## Zero-Config Autonomous Mode (MongoDB)
ElectroFine runs **100% independently out of the box** without requiring any `.env` variables. It uses Mongoose ODM backed by an embedded MongoDB document store (`electrofine_pickups`, `electrofine_payouts`, `electrofine_collectors`, `electrofine_store_items`) and automatically connects to an external MongoDB cluster if `MONGODB_URI` is optionally provided.
