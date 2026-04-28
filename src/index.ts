#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { searchContacts, getContact, listContacts } from "./people.js";

const server = new Server(
  { name: "google-contacts-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_contacts",
      description:
        "Search the user's Google Contacts by name, email, phone, or organization. Returns matching contacts with display name, emails, phones, and organization. Use this to resolve a person's name to an email address before adding them to a calendar event.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search string (name, email, etc.)" },
          page_size: { type: "number", description: "Max results (default 25)" },
        },
        required: ["query"],
      },
    },
    {
      name: "get_contact",
      description:
        "Fetch a single contact's full details by their resource name (e.g. 'people/c12345'). Use after search_contacts to get more detail on a specific person.",
      inputSchema: {
        type: "object",
        properties: {
          resource_name: {
            type: "string",
            description: "Contact resource name from search_contacts results",
          },
        },
        required: ["resource_name"],
      },
    },
    {
      name: "list_contacts",
      description:
        "List the user's contacts (paginated). Prefer search_contacts when you have any query string — list is for full enumeration.",
      inputSchema: {
        type: "object",
        properties: {
          page_size: { type: "number", description: "Max results per page (default 100)" },
          page_token: { type: "string", description: "Pagination token from previous response" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === "search_contacts") {
      const a = (args || {}) as { query: string; page_size?: number };
      const results = await searchContacts(a.query, a.page_size);
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }
    if (name === "get_contact") {
      const a = (args || {}) as { resource_name: string };
      const result = await getContact(a.resource_name);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    if (name === "list_contacts") {
      const a = (args || {}) as { page_size?: number; page_token?: string };
      const result = await listContacts(a.page_size, a.page_token);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${msg}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
