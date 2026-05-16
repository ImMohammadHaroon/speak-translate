/**
 * Vercel serverless route: GET /api/keep-alive
 * Optional: `npm i -D @vercel/node` and swap in `import type { VercelRequest, VercelResponse } from '@vercel/node'`.
 */
interface VercelRequest {
  // extend as needed
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase responded with status: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      db: 'connected',
      rows: Array.isArray(data) ? data.length : 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      status: 'error',
      message,
    });
  }
}
