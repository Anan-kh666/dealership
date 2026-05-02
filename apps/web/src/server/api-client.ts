/**
 * Thin fetch wrapper aimed at the Fastify API. Replaced or expanded by feature
 * agents when concrete endpoints land.
 */
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
}
