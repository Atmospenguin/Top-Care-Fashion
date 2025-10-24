require("dotenv").config({ path: ".env.local" });
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { readFileSync } from "fs";

const normalize = (s="") => s.replace(/\\n/g,"\n").replace(/\r/g,"").replace(/^"|"$/g,"").trim();

async function main() {
  const imgPath = process.argv[2];
  if (!imgPath) throw new Error("Usage: tsx scripts/check-vision.ts path/to/image.jpg");

  const client = new ImageAnnotatorClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL!,
      private_key: normalize(process.env.GOOGLE_PRIVATE_KEY!),
    },
  });

  const buf = readFileSync(imgPath);
  const [res] = await client.labelDetection({ image: { content: buf } });
  const labels = (res.labelAnnotations || []).slice(0, 5).map(l => `${l.description}:${(l.score||0).toFixed(2)}`);
  console.log("Vision labels (top 5):", labels);
}
main().catch(e => { console.error("Vision check FAILED:", e.message); process.exit(1); });
