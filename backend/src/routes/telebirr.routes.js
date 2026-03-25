/**
 * @fileoverview Telebirr Payment Routes
 * Defines API endpoints for telebirr B2B payment integration.
 *
 * Routes:
 *  POST /api/telebirr/initiate       – Initiate payment (requires auth)
 *  POST /api/telebirr/webhook        – Receive payment notification (NO auth)
 *  GET  /api/telebirr/status/:merchOrderId – Check status (requires auth)
 *
 * @module routes/telebirr
 */

const { Router } = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
  initiatePayment,
  handleWebhook,
  checkPaymentStatus,
} = require("../controllers/telebirr.controller");

const router = Router();

// Authenticated: gym owner initiates a payment
router.post("/initiate", authenticate, initiatePayment);

// Public: telebirr server sends payment notification (no auth middleware)
router.post("/webhook", handleWebhook);

// Authenticated: frontend polls for payment confirmation
router.get("/status/:merchOrderId", authenticate, checkPaymentStatus);

module.exports = router;
