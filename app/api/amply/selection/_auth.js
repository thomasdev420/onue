import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';

/** Used when no session; all anon traffic shares this row scope unless you add per-browser IDs later. */
const ANON_USER_ID =
  process.env.AMPLY_SELECTION_ANON_USER_ID || 'anonymous@amply.selection';

/**
 * Resolves the selection "tenant" id (stored as user_id on products).
 * Signed-in users use their email. Unsigned: allowed unless AMPLY_SELECTION_ALLOW_ANON=0.
 */
export async function getSelectionUserEmail() {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && process.env.AMPLY_SELECTION_DEV_BYPASS === '1') {
    return process.env.AMPLY_SELECTION_DEV_EMAIL || 'dev@local.com';
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return session.user.email;
  }

  // Temporary MVP: try the engine without signing in. Set AMPLY_SELECTION_ALLOW_ANON=0 to require auth.
  const allowAnon = process.env.AMPLY_SELECTION_ALLOW_ANON !== '0';
  if (allowAnon) {
    return ANON_USER_ID;
  }

  return null;
}
