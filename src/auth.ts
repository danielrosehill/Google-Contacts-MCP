import { google } from "googleapis";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SCOPES = ["https://www.googleapis.com/auth/contacts.readonly"];

const TOKEN_PATH =
  process.env.GOOGLE_CONTACTS_TOKEN_PATH ||
  join(homedir(), ".config", "google-contacts-mcp", "token.json");

const CREDS_PATH =
  process.env.GOOGLE_CONTACTS_CREDENTIALS_PATH ||
  join(homedir(), ".config", "google-contacts-mcp", "credentials.json");

export function getAuthClient() {
  const clientId = process.env.GOOGLE_CONTACTS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CONTACTS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CONTACTS_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    return oAuth2Client;
  }

  if (existsSync(CREDS_PATH) && existsSync(TOKEN_PATH)) {
    const creds = JSON.parse(readFileSync(CREDS_PATH, "utf8"));
    const installed = creds.installed || creds.web;
    const oAuth2Client = new google.auth.OAuth2(
      installed.client_id,
      installed.client_secret,
      installed.redirect_uris?.[0] || "urn:ietf:wg:oauth:2.0:oob"
    );
    const token = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  throw new Error(
    `No credentials. Set GOOGLE_CONTACTS_CLIENT_ID + GOOGLE_CONTACTS_CLIENT_SECRET + GOOGLE_CONTACTS_REFRESH_TOKEN env vars, or run 'npx google-contacts-mcp auth' after placing OAuth credentials at ${CREDS_PATH}.`
  );
}

export { SCOPES, TOKEN_PATH, CREDS_PATH };
