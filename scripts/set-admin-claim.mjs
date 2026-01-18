import fs from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const email = process.argv[2];

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error(
    "Missing service account key. Set GOOGLE_APPLICATION_CREDENTIALS to the JSON path."
  );
  process.exit(1);
}

if (!email) {
  console.error("Usage: node scripts/set-admin-claim.mjs user@example.com");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { admin: true });

console.log(`Admin claim set for ${email}. Re-login to refresh the token.`);
