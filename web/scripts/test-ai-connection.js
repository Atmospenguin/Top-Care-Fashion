// test-ai-connections.js
// ✅ Tests both Google Vision and Gemini connectivity + credentials

import { ImageAnnotatorClient } from "@google-cloud/vision";
import fetch from "node-fetch";

const {
  GOOGLE_CLOUD_PROJECT,
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_API_KEY,
  GEMINI_API_KEY,
} = process.env;

(async () => {
  console.log("🔍 Checking environment variables...");
  const missing = [];
  if (!GOOGLE_CLOUD_PROJECT) missing.push("GOOGLE_CLOUD_PROJECT");
  if (!GOOGLE_CLIENT_EMAIL) missing.push("GOOGLE_CLIENT_EMAIL");
  if (!GOOGLE_PRIVATE_KEY) missing.push("GOOGLE_PRIVATE_KEY");
  if (!GOOGLE_API_KEY && !GEMINI_API_KEY) missing.push("GOOGLE_API_KEY or GEMINI_API_KEY");

  if (missing.length) {
    console.error("❌ Missing:", missing.join(", "));
    process.exit(1);
  }

  // ----------------------------
  // 1️⃣ Test Google Vision
  // ----------------------------
  console.log("\n🧠 Testing Google Vision API...");
  try {
    const fixedKey = GOOGLE_PRIVATE_KEY.includes("\\n")
      ? GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : GOOGLE_PRIVATE_KEY;

    const vision = new ImageAnnotatorClient({
      projectId: GOOGLE_CLOUD_PROJECT,
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: fixedKey,
      },
    });

    const [result] = await vision.labelDetection({
      image: { source: { imageUri: "https://storage.googleapis.com/cloud-samples-data/vision/using_curl/shoes.jpg" } },
      maxResults: 5,
    });

    const labels = result.labelAnnotations?.map((l) => l.description) || [];
    console.log("✅ Google Vision connected! Sample labels:", labels.join(", "));
  } catch (err) {
    console.error("❌ Google Vision test failed:", err.message);
  }

  // ----------------------------
  // 2️⃣ Test Gemini
  // ----------------------------
  console.log("\n✨ Testing Gemini API...");
  const key = GOOGLE_API_KEY || GEMINI_API_KEY;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Reply with the word 'connected' if you received this." }] }],
        }),
      }
    );

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const json = await res.json();
    console.log("✅ Gemini connected! Model reply:", json?.candidates?.[0]?.content?.parts?.[0]?.text || "No text");
  } catch (err) {
    console.error("❌ Gemini test failed:", err.message);
  }
})();
