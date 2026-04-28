import { google, people_v1 } from "googleapis";
import { getAuthClient } from "./auth.js";

const PERSON_FIELDS =
  "names,emailAddresses,phoneNumbers,organizations,addresses,metadata";

let cached: people_v1.People | null = null;

function client(): people_v1.People {
  if (cached) return cached;
  cached = google.people({ version: "v1", auth: getAuthClient() });
  return cached;
}

export type ContactSummary = {
  resourceName: string;
  displayName: string;
  emails: string[];
  phones: string[];
  organization?: string;
};

function summarise(p: people_v1.Schema$Person): ContactSummary {
  return {
    resourceName: p.resourceName || "",
    displayName: p.names?.[0]?.displayName || "(no name)",
    emails: (p.emailAddresses || []).map((e) => e.value || "").filter(Boolean),
    phones: (p.phoneNumbers || []).map((n) => n.value || "").filter(Boolean),
    organization: p.organizations?.[0]?.name || undefined,
  };
}

export async function searchContacts(
  query: string,
  pageSize = 25
): Promise<ContactSummary[]> {
  const c = client();
  // Warmup call required by the People API for searchContacts
  await c.people.searchContacts({ query: "", readMask: PERSON_FIELDS, pageSize: 1 });

  const res = await c.people.searchContacts({
    query,
    readMask: PERSON_FIELDS,
    pageSize,
  });
  return (res.data.results || [])
    .map((r) => r.person)
    .filter((p): p is people_v1.Schema$Person => !!p)
    .map(summarise);
}

export async function getContact(resourceName: string) {
  const c = client();
  const res = await c.people.get({
    resourceName,
    personFields: PERSON_FIELDS,
  });
  return summarise(res.data);
}

export async function listContacts(pageSize = 100, pageToken?: string) {
  const c = client();
  const res = await c.people.connections.list({
    resourceName: "people/me",
    personFields: PERSON_FIELDS,
    pageSize,
    pageToken,
  });
  return {
    contacts: (res.data.connections || []).map(summarise),
    nextPageToken: res.data.nextPageToken || undefined,
    totalPeople: res.data.totalPeople || undefined,
  };
}
