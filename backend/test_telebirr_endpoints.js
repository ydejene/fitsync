process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
async function testRegister() {
  console.log("1. Testing Register Endpoint...");
  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test Gym Owner",
        email: `testowner_${Date.now()}@gym.com`,
        password: "TestPassword123!",
        phone: "+251911000000"
      })
    });
    
    // We need the cookie for the next request
    const cookie = res.headers.get("set-cookie");
    const data = await res.json();
    console.log("Register Response:", JSON.stringify(data, null, 2));
    
    return { success: data.success, cookie };
  } catch (err) {
    console.error("Register test failed:", err.message);
    return { success: false };
  }
}

async function testInitiate(cookie) {
  console.log("\n2. Testing Initiate Payment Endpoint...");
  try {
    // Note: We need a valid planId. Let's get one from the db first, or try assuming id is 1, 
    // Wait, the DB uses UUIDs for plans according to the schema!
    // Since we just seeded the DB, let's fetch the plans first.
    
    const plansRes = await fetch("http://localhost:5000/api/subscription-plans");
    const plansData = await plansRes.json();
    
    if (!plansData.success || plansData.data.length === 0) {
      console.error("Failed to fetch subscription plans");
      return;
    }
    
    const targetPlanId = plansData.data[0].id;
    console.log(`Using Plan ID: ${targetPlanId}`);
    
    const res = await fetch("http://localhost:5000/api/telebirr/initiate", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": cookie ? cookie.split(";")[0] : "" // pass the fitsync_token
      },
      body: JSON.stringify({ planId: targetPlanId })
    });
    
    const data = await res.json();
    console.log("Initiate Response:", JSON.stringify(data, null, 2));
    
    return data;
  } catch (err) {
    console.error("Initiate test failed:", err.message);
  }
}

async function testWebhook() {
  console.log("\n3. Testing Webhook Endpoint Accessibility...");
  try {
    const res = await fetch("http://localhost:5000/api/telebirr/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true })
    });
    
    const data = await res.json();
    // It should hit the endpoint but return an error like "Missing merch_order_id"
    console.log("Webhook Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Webhook test failed:", err.message);
  }
}

async function runTests() {
  // Wait a second for the server to be fully ready
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { success, cookie } = await testRegister();
  if (success && cookie) {
    // Testing initiate payment will likely fail with real API credentials if .env is missing,
    // but we can at least test until the point it triggers an error or if we mock the fetch in telebirr.service.js.
    // Let's run it anyway to see the behavior.
    await testInitiate(cookie);
  }
  
  await testWebhook();
}

runTests();
