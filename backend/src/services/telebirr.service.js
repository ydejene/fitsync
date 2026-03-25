/**
 * @fileoverview Telebirr B2B Web Checkout Payment Service
 * Handles all direct communication with the Telebirr payment gateway.
 *
 * Flow: applyFabricToken() → createOrder() → generateCheckoutUrl()
 *
 * @see Telebirr_API_Docs.md for full API specification
 * @module services/telebirr
 */

const rs = require("jsrsasign");

// IMPORTANT: Telebirr Sandbox (developerportal.ethiotelebirr.et:38443) uses a self-signed
// or untrusted SSL certificate. Node.js native fetch will block this by default with
// UNABLE_TO_VERIFY_LEAF_SIGNATURE. We must disable strict TLS verification for the sandbox.
if (process.env.NODE_ENV === "development" || process.env.TELEBIRR_BASE_URL.includes("developerportal")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// ── Configuration from environment ──────────────────────────────────────────
const config = {
  baseUrl:        process.env.TELEBIRR_BASE_URL,
  fabricAppId:    process.env.TELEBIRR_FABRIC_APP_ID,
  appSecret:      process.env.TELEBIRR_APP_SECRET,
  merchantAppId:  process.env.TELEBIRR_MERCHANT_APP_ID,
  merchantCode:   process.env.TELEBIRR_MERCH_CODE,
  privateKey:     process.env.TELEBIRR_PRIVATE_KEY,
  webBaseUrl:     process.env.TELEBIRR_WEB_BASE_URL,
  notifyUrl:      process.env.TELEBIRR_NOTIFY_URL,
  redirectUrl:    process.env.TELEBIRR_REDIRECT_URL,
};

// Fields excluded from signature calculation per Telebirr spec
const EXCLUDE_FIELDS = [
  "sign", "sign_type", "header", "refund_info",
  "openType", "raw_request", "biz_content", "wallet_reference_data",
];

// ── Utility Functions ───────────────────────────────────────────────────────

/**
 * Generates a Unix timestamp (seconds since epoch) as a string.
 * Used for the `timestamp` field in Telebirr API requests.
 * @returns {string} Current Unix timestamp
 */
function createTimeStamp() {
  return Math.round(Date.now() / 1000) + "";
}

/**
 * Generates a 32-character random nonce string (uppercase alphanumeric).
 * Required by Telebirr for request uniqueness and replay protection.
 * @returns {string} 32-char random string
 */
function createNonceStr() {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let str = "";
  for (let i = 0; i < 32; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

/**
 * Signs a string using SHA256withRSAandMGF1 with the merchant's private key.
 * This is the exact algorithm required by Telebirr's payment gateway.
 *
 * @param {string} text - The concatenated key=value string to sign
 * @param {string} privateKey - RSA private key (PEM or raw base64 format)
 * @returns {string} Base64-encoded signature
 */
function signString(text, privateKey) {
  // Ensure the private key is in proper PEM format for jsrsasign
  let formattedKey = privateKey;
  if (!formattedKey.includes("BEGIN PRIVATE KEY") && !formattedKey.includes("BEGIN RSA PRIVATE KEY")) {
    // Break raw base64 string into 64-character lines (standard PEM format)
    const blocks = formattedKey.match(/.{1,64}/g) || [];
    formattedKey = `-----BEGIN PRIVATE KEY-----\n${blocks.join("\n")}\n-----END PRIVATE KEY-----`;
  } else {
    // If it has headers but written on one line in .env, replace literal \n with real newlines
    formattedKey = formattedKey.replace(/\\n/g, "\n");
  }

  const sig = new rs.KJUR.crypto.Signature({ alg: "SHA256withRSAandMGF1" });
  sig.init(formattedKey);
  sig.updateString(text);
  return rs.hextob64(sig.sign());
}

/**
 * Creates a digital signature for an entire request object.
 * Per Telebirr spec: extracts all fields (including nested biz_content fields),
 * excludes sign-related fields, sorts alphabetically, joins as key=value&key=value,
 * then signs with SHA256WithRSA.
 *
 * @param {Object} requestObject - The full request object with biz_content
 * @returns {string} Base64-encoded SHA256WithRSA signature
 */
function signRequestObject(requestObject) {
  const fields = [];
  const fieldMap = {};

  // Collect top-level fields (excluding sign-related)
  for (const key in requestObject) {
    if (EXCLUDE_FIELDS.includes(key)) continue;
    fields.push(key);
    fieldMap[key] = requestObject[key];
  }

  // Flatten biz_content fields into signature (per Telebirr spec)
  if (requestObject.biz_content) {
    for (const key in requestObject.biz_content) {
      if (EXCLUDE_FIELDS.includes(key)) continue;
      fields.push(key);
      fieldMap[key] = requestObject.biz_content[key];
    }
  }

  // Sort alphabetically and join as key=value pairs
  fields.sort();
  const signOriginStr = fields.map((k) => `${k}=${fieldMap[k]}`).join("&");

  return signString(signOriginStr, config.privateKey);
}

/**
 * Generates a unique merchant order ID for each transaction.
 * Uses timestamp + random suffix for uniqueness.
 * @returns {string} Unique order ID (alphanumeric only, max 64 chars)
 */
function createMerchOrderId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FS${timestamp}${random}`;
}

// ── Core API Methods ────────────────────────────────────────────────────────

/**
 * Step 1: Obtains a Fabric Token from the Telebirr gateway.
 * This token is required as Authorization header for all subsequent API calls.
 *
 * @returns {Promise<string>} Bearer token string
 * @throws {Error} If token request fails
 */
async function applyFabricToken() {
  const url = `${config.baseUrl}/payment/v1/token`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-APP-Key": config.fabricAppId,
    },
    body: JSON.stringify({ appSecret: config.appSecret }),
  });

  const result = await response.json();

  if (!result.token) {
    throw new Error(`Failed to obtain Fabric token: ${JSON.stringify(result)}`);
  }

  return result.token;
}

/**
 * Step 2: Creates a pre-order on the Telebirr payment gateway.
 * Constructs the signed request body and sends to the preOrder endpoint.
 *
 * @param {Object} params - Order parameters
 * @param {string} params.title      - Payment title (e.g., "FitSync Monthly Plan")
 * @param {string} params.amount     - Amount in ETB (e.g., "2500")
 * @param {string} params.merchOrderId - Unique merchant order ID
 * @returns {Promise<Object>} Response containing prepay_id and merch_order_id
 * @throws {Error} If order creation fails
 */
async function createOrder({ title, amount, merchOrderId }) {
  const fabricToken = await applyFabricToken();

  // Build request object per Telebirr API spec
  const req = {
    timestamp: createTimeStamp(),
    nonce_str: createNonceStr(),
    method: "payment.preorder",
    version: "1.0",
  };

  // Business content (order details)
  req.biz_content = {
    notify_url:           config.notifyUrl,
    redirect_url:         config.redirectUrl,
    appid:                config.merchantAppId,
    merch_code:           config.merchantCode,
    merch_order_id:       merchOrderId,
    trade_type:           "Checkout",
    title:                title,
    total_amount:         amount,
    trans_currency:       "ETB",
    timeout_express:      "120m",
    business_type:        "BuyGoods",
    payee_identifier:     config.merchantCode,
    payee_identifier_type: "04",
    payee_type:           "5000",
  };

  // Sign the request and add signature fields
  req.sign = signRequestObject(req);
  req.sign_type = "SHA256WithRSA";

  const url = `${config.baseUrl}/payment/v1/merchant/preOrder`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-APP-Key": config.fabricAppId,
      Authorization: fabricToken,
    },
    body: JSON.stringify(req),
  });

  const result = await response.json();

  if (result.result !== "SUCCESS") {
    throw new Error(`Create order failed: ${result.msg || JSON.stringify(result)}`);
  }

  return {
    prepayId:     result.biz_content.prepay_id,
    merchOrderId: result.biz_content.merch_order_id,
    rawResponse:  result,
  };
}

/**
 * Step 3: Generates the checkout URL that the user is redirected to for payment.
 * Constructs rawRequest from prepay_id, signs it, and appends to webBaseUrl.
 *
 * @param {string} prepayId - The prepay_id returned from createOrder
 * @returns {string} Full checkout URL for browser redirect
 */
function generateCheckoutUrl(prepayId) {
  const map = {
    appid:      config.merchantAppId,
    merch_code: config.merchantCode,
    nonce_str:  createNonceStr(),
    prepay_id:  prepayId,
    timestamp:  createTimeStamp(),
  };

  const sign = signRequestObject({ biz_content: map });

  // Build rawRequest string (alphabetically ordered + sign fields)
  const rawRequest = [
    `appid=${map.appid}`,
    `merch_code=${map.merch_code}`,
    `nonce_str=${map.nonce_str}`,
    `prepay_id=${map.prepay_id}`,
    `timestamp=${map.timestamp}`,
    `sign=${sign}`,
    `sign_type=SHA256WithRSA`,
  ].join("&");

  const otherParams = "&version=1.0&trade_type=Checkout";

  return `${config.webBaseUrl}${rawRequest}${otherParams}`;
}

/**
 * Step 5: Queries the status of an existing order.
 * Useful for verifying payment status when webhook hasn't arrived yet.
 *
 * @param {string} merchOrderId - The merchant order ID to query
 * @returns {Promise<Object>} Order status response from Telebirr
 * @throws {Error} If query fails
 */
async function queryOrder(merchOrderId) {
  const fabricToken = await applyFabricToken();

  const req = {
    timestamp: createTimeStamp(),
    nonce_str: createNonceStr(),
    method: "payment.queryorder",
    version: "1.0",
  };

  req.biz_content = {
    appid:          config.merchantAppId,
    merch_code:     config.merchantCode,
    merch_order_id: merchOrderId,
  };

  req.sign = signRequestObject(req);
  req.sign_type = "SHA256WithRSA";

  const url = `${config.baseUrl}/payment/v1/merchant/queryOrder`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-APP-Key": config.fabricAppId,
      Authorization: fabricToken,
    },
    body: JSON.stringify(req),
  });

  return await response.json();
}

module.exports = {
  applyFabricToken,
  createOrder,
  generateCheckoutUrl,
  queryOrder,
  createMerchOrderId,
};
