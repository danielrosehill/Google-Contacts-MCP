# Google-Contacts-MCP

Minimal MCP server for the Google People API — read-only contact search and lookup. Built as a companion to Claude Code's [`schedule-manager`](https://github.com/danielrosehill/Claude-Schedule-Manager-Plugin) plugin and any agent that needs to resolve a person's name to an email address before adding them to a calendar event.

## Why this exists

The official [Google Workspace MCP](https://github.com/gemini-cli-extensions/workspace) covers Calendar, Docs, Sheets, Slides, Gmail, and Chat — but not Contacts. This is a thin, single-purpose server for that gap.

## Tools

| Tool | Purpose |
|---|---|
| `search_contacts(query, page_size?)` | Search by name, email, phone, or organization |
| `get_contact(resource_name)` | Fetch full details for one contact |
| `list_contacts(page_size?, page_token?)` | Paginated full enumeration |

All operations are **read-only**. The OAuth scope requested is `contacts.readonly`.

## Setup

### 1. Install

```bash
npm install -g google-contacts-mcp
# or run via npx without installing
```

### 2. OAuth credentials

Create an OAuth 2.0 Client ID (Desktop app type) at <https://console.cloud.google.com/apis/credentials> and enable the People API for your project.

Place the downloaded credentials JSON at:

```
~/.config/google-contacts-mcp/credentials.json
```

(Override with `GOOGLE_CONTACTS_CREDENTIALS_PATH` env var.)

### 3. Authorise

```bash
google-contacts-mcp auth
```

Follow the prompt: visit the URL, approve, paste the code back. Token is written to `~/.config/google-contacts-mcp/token.json` (chmod 600).

### 4. Headless / env-var configuration (optional)

For deployment without a token file, set:

```bash
export GOOGLE_CONTACTS_CLIENT_ID=...
export GOOGLE_CONTACTS_CLIENT_SECRET=...
export GOOGLE_CONTACTS_REFRESH_TOKEN=...
```

The `auth` command prints these for you after a successful authorisation.

## Wiring up to Claude Code

```bash
claude mcp add google-contacts -- npx -y google-contacts-mcp
```

If using env vars instead of a token file, pass them through:

```bash
claude mcp add google-contacts \
  -e GOOGLE_CONTACTS_CLIENT_ID=$GOOGLE_CONTACTS_CLIENT_ID \
  -e GOOGLE_CONTACTS_CLIENT_SECRET=$GOOGLE_CONTACTS_CLIENT_SECRET \
  -e GOOGLE_CONTACTS_REFRESH_TOKEN=$GOOGLE_CONTACTS_REFRESH_TOKEN \
  -- npx -y google-contacts-mcp
```

## Development

```bash
git clone https://github.com/danielrosehill/Google-Contacts-MCP
cd Google-Contacts-MCP
npm install
npm run build
node dist/index.js  # smoke test (will block on stdin — that's expected for an MCP server)
```

## License

MIT
