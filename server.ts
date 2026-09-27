import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  mongoDb,
  calculatePayoutQuote,
  BASE_RATES_PER_KG,
  CONDITION_MULTIPLIERS,
  MARKET_FACTOR,
  DEFAULT_SERVICE_FEE
} from './src/db/mongodb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await mongoDb.connect();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // ==========================================================================
  // 1. HEALTH & DATABASE STATUS
  // ==========================================================================
  app.get('/api/v1/health', (_req, res) => {
    const summary = mongoDb.getDashboardSummary();
    res.json({
      status: 'healthy',
      platform: 'ElectroFine E-Waste Recycling Platform',
      environment: 'autonomous-zero-config',
      database: summary.database
    });
  });

  app.get('/api/v1/db/status', (_req, res) => {
    const summary = mongoDb.getDashboardSummary();
    res.json({
      status: 'success',
      ...summary.database
    });
  });

  // ==========================================================================
  // 2. AUTH ROUTES (/api/auth/*)
  // ==========================================================================
  app.post('/api/auth/register', (req, res) => {
    const user = mongoDb.authenticateUser(req.body || {});
    res.json({
      status: 'success',
      token: 'ef-jwt-autonomous-token',
      user
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const user = mongoDb.authenticateUser(req.body || {});
    res.json({
      status: 'success',
      token: 'ef-jwt-autonomous-token',
      refreshToken: 'ef-jwt-refresh-token',
      user
    });
  });

  app.post('/api/auth/refresh', (_req, res) => {
    res.json({
      status: 'success',
      token: 'ef-jwt-refreshed-token'
    });
  });

  // ==========================================================================
  // 3. DASHBOARD SUMMARY (/api/dashboard/summary)
  // ==========================================================================
  app.get('/api/dashboard/summary', (_req, res) => {
    res.json({
      status: 'success',
      ...mongoDb.getDashboardSummary()
    });
  });

  // ==========================================================================
  // 4. SMART PICKUP SCHEDULING & MANAGEMENT (/api/pickups/*)
  // ==========================================================================
  app.get('/api/pickups', (req, res) => {
    const status = req.query.status as string | undefined;
    const pickups = mongoDb.getPickups(status);
    res.json({
      status: 'success',
      count: pickups.length,
      pickups
    });
  });

  app.get('/api/pickups/:id', (req, res) => {
    const pickup = mongoDb.getPickupById(req.params.id);
    res.json({
      status: 'success',
      pickup
    });
  });

  app.post('/api/pickups', (req, res) => {
    const pickup = mongoDb.createPickup(req.body || {});
    res.json({
      status: 'success',
      pickup
    });
  });

  app.patch('/api/pickups/:id/reschedule', (req, res) => {
    const { scheduledDate, scheduledSlot } = req.body || {};
    const pickup = mongoDb.reschedulePickup(
      req.params.id,
      scheduledDate || '30 Oct 2026',
      scheduledSlot || '11:00 AM - 01:00 PM'
    );
    res.json({
      status: 'success',
      pickup
    });
  });

  app.patch('/api/pickups/:id/cancel', (req, res) => {
    const pickup = mongoDb.cancelPickup(req.params.id);
    res.json({
      status: 'success',
      pickup
    });
  });

  // ==========================================================================
  // 5. REAL-TIME COLLECTOR TRACKING & WORKFLOW (/api/tracking/*)
  // ==========================================================================
  app.get('/api/tracking/:pickupId', (req, res) => {
    const pickup = mongoDb.getPickupById(req.params.pickupId);
    res.json({
      status: 'success',
      pickupId: pickup.id,
      currentStatus: pickup.status,
      collector: pickup.collector,
      timeline: pickup.timeline,
      verificationProof: pickup.verificationProof,
      quote: pickup.quote
    });
  });

  app.post('/api/tracking/:pickupId/update', (req, res) => {
    const updated = mongoDb.updatePickupStatusAndLocation(req.params.pickupId, req.body || {});
    res.json({
      status: 'success',
      pickup: updated
    });
  });

  // ==========================================================================
  // 6. FAIR PAYOUT ENGINE & PRICING (/api/pricing/* & /api/payouts/*)
  // ==========================================================================
  app.post('/api/pricing/estimate', (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const quote = calculatePayoutQuote(items);
    res.json({
      status: 'success',
      quote,
      ratesReference: {
        baseRatesPerKg: BASE_RATES_PER_KG,
        conditionMultipliers: CONDITION_MULTIPLIERS,
        marketFactor: MARKET_FACTOR,
        defaultServiceFee: DEFAULT_SERVICE_FEE
      }
    });
  });

  app.get('/api/payouts', (_req, res) => {
    const payouts = mongoDb.getPayouts();
    res.json({
      status: 'success',
      payouts
    });
  });

  app.post('/api/payouts/:pickupId/process', (req, res) => {
    const pickup = mongoDb.processPayout(req.params.pickupId);
    res.json({
      status: 'success',
      pickup,
      payouts: mongoDb.getPayouts()
    });
  });

  app.get('/api/payouts/:pickupId/status', (req, res) => {
    const payouts = mongoDb.getPayouts();
    const found = payouts.find((p) => p.pickupId === req.params.pickupId) || payouts[0];
    res.json({
      status: 'success',
      payout: found
    });
  });

  app.post('/api/payouts/validate-card', (req, res) => {
    const { cardNumber, action } = req.body || {};
    const result = mongoDb.validateOrRegisterCard(String(cardNumber || ''), action || 'validate');
    res.json({
      status: 'success',
      ...result
    });
  });

  // ==========================================================================
  // 7. ECO STORE & POINTS REDEMPTION (/api/store/*)
  // ==========================================================================
  app.get('/api/store/items', (_req, res) => {
    res.json({
      status: 'success',
      items: mongoDb.getStoreItems(),
      pointsBalance: mongoDb.getDashboardSummary().metrics.pointsBalance
    });
  });

  app.post('/api/store/redeem', (req, res) => {
    const result = mongoDb.redeemStoreItem(String(req.body?.itemId || ''));
    res.json(result);
  });

  // Vite middleware in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API route not found' });
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ElectroFine E-Waste Platform listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
