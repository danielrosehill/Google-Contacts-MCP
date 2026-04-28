#!/usr/bin/env node
// One-shot OAuth flow: prompts user to authorise and writes token.json.
// Run with: npx google-contacts-mcp auth (after `npm run build`)
// Or directly: node dist/auth-cli.js
import { google } from "googleapis";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { SCOPES, TOKEN_PATH, CREDS_PATH } from "./auth.js";

if (!existsSync(CREDS_PATH)) {
  console.error(
    `Missing OAuth client credentials at: ${CREDS_PATH}\n\n` +
      `1. Go to https://console.cloud.google.com/apis/credentials\n` +
      `2. Create an OAuth 2.0 Client ID (Desktop app type)\n` +
      `3. Download the JSON and save it to the path above.\n` +
      `4. Re-run this command.`
  );
  process.exit(1);
}

const creds = JSON.parse(readFileSync(CREDS_PATH, "utf8"));
const installed = creds.installed || creds.web;
const oAuth2Client = new google.auth.OAuth2(
  installed.client_id,
  installed.client_secret,
  installed.redirect_uris?.[0] || "urn:ietf:wg:oauth:2.0:oob"
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("Authorise this app by visiting:\n");
console.log(authUrl);
console.log("\nAfter approval, paste the authorisation code below.\n");

const rl = createInterface({ input, output });
const code = (await rl.question("Code: ")).trim();
rl.close();

const { tokens } = await oAuth2Client.getToken(code);
mkdirSync(dirname(TOKEN_PATH), { recursive: true });
writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });
console.log(`Token saved to ${TOKEN_PATH}`);
if (tokens.refresh_token) {
  console.log(
    `\nRefresh token captured. For headless deployment, set:\n` +
      `  GOOGLE_CONTACTS_CLIENT_ID=${installed.client_id}\n` +
      `  GOOGLE_CONTACTS_CLIENT_SECRET=${installed.client_secret}\n` +
      `  GOOGLE_CONTACTS_REFRESH_TOKEN=${tokens.refresh_token}`
  );
}
