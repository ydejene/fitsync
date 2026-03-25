require("dotenv").config();
const rs = require("jsrsasign");

function signString(text, privateKey) {
  let formattedKey = privateKey;
  if (!formattedKey.includes("BEGIN PRIVATE KEY") && !formattedKey.includes("BEGIN RSA PRIVATE KEY")) {
    const blocks = formattedKey.match(/.{1,64}/g) || [];
    formattedKey = `-----BEGIN PRIVATE KEY-----\n${blocks.join("\n")}\n-----END PRIVATE KEY-----`;
  } else {
    formattedKey = formattedKey.replace(/\\n/g, "\n");
  }

  const sig = new rs.KJUR.crypto.Signature({ alg: "SHA256withRSAandMGF1" });
  sig.init(formattedKey);
  sig.updateString(text);
  return rs.hextob64(sig.sign());
}

try {
  console.log("Testing RSA signature generation...");
  const signature = signString("appid=test&amount=100", process.env.TELEBIRR_PRIVATE_KEY);
  console.log("SUCCESS! Signature generated, length:", signature.length);
} catch (err) {
  console.error("FAILED with error:", err.message);
  console.error(err.stack);
}
