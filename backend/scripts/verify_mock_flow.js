const BACKEND_URL = "http://localhost:5000";

async function verifyMockFlow() {
  console.log("--- Verifying Telebirr Mock Flow (Demo Mode) ---");

  // 1. Register a new Test Owner
  console.log("\n1. Registering new owner...");
  const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Demo Gym Owner",
      email: `demo_${Date.now()}@gym.com`,
      password: "Password123!",
      phone: "+251912345678",
      gymName: "Demo Gym"
    })
  });
  const regData = await regRes.json();
  const cookie = regRes.headers.get("set-cookie");

  if (!regData.success) {
    console.error("Registration failed:", regData.message);
    return;
  }
  console.log("Owner Registered!");

  // 2. Fetch Plan
  const plansRes = await fetch(`${BACKEND_URL}/api/subscription-plans`);
  const plansData = await plansRes.json();
  const planId = plansData.data[0].id;

  // 3. Initiate Payment (Should return MOCK URL)
  console.log("\n2. Initiating payment (Demo Mode)...");
  const initRes = await fetch(`${BACKEND_URL}/api/telebirr/initiate`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookie?.split(";")[0] || ""
    },
    body: JSON.stringify({ planId })
  });
  const initData = await initRes.json();

  if (!initData.success || !initData.data.checkoutUrl.includes("/payment/mock")) {
    console.error("Initiation failed or didn't return Mock URL:", initData);
    return;
  }
  console.log("Success! Mock URL returned:", initData.data.checkoutUrl);
  const merchOrderId = initData.data.merchOrderId;

  // 4. Call Mock Payment Success
  console.log("\n3. Simulating Mock Payment Success...");
  const mockRes = await fetch(`${BACKEND_URL}/api/telebirr/mock-payment`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookie?.split(";")[0] || ""
    },
    body: JSON.stringify({ merchOrderId })
  });
  const mockData = await mockRes.json();

  if (!mockData.success) {
    console.error("Mock payment failed:", mockData.message);
    return;
  }
  console.log("Success! Mock payment completed.");

  // 5. Verify User Status
  console.log("\n4. Verifying User Subscription Status...");
  const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: { "Cookie": cookie?.split(";")[0] || "" }
  });
  const meData = await meRes.json();

  if (meData.data.user.subscriptionStatus === "active") {
    console.log("✅ VERIFICATION SUCCESSFUL: User is now ACTIVE!");
  } else {
    console.error("❌ VERIFICATION FAILED: User status is still", meData.data.user.subscriptionStatus);
  }
}

verifyMockFlow();
