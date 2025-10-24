require("dotenv").config({ path: ".env.local" });
import { JWT } from "google-auth-library";

const normalize = (s="") => s.replace(/\\n/g,"\n").replace(/\r/g,"").replace(/^"|"$/g,"").trim();

async function main() {
  const client = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL!,
    key: normalize(process.env.GOOGLE_PRIVATE_KEY!),
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const t = await client.authorize();
  console.log("Google auth OK. Expires:", new Date(t.expiry_date || 0).toISOString());
}
main().catch(e => { console.error("Google auth FAILED:", e.message); process.exit(1); });
