import { createHash, randomBytes } from 'node:crypto';
import { getSupabaseServiceRole } from '@/app/services/amplySelection/supabaseAdmin';

export function hashApiKeySecret(raw) {
  return createHash('sha256').update(String(raw), 'utf8').digest('hex');
}

/** @returns {{ raw: string, prefix: string }} */
export function generateApiKeyMaterial() {
  const raw = `amply_sk_${randomBytes(24).toString('base64url')}`;
  const prefix = `${raw.slice(0, 14)}…`;
  return { raw, prefix };
}

/**
 * @param {string} rawSecret full key from Authorization header
 * @returns {Promise<{ ok: boolean, userId?: string }>}
 */
export async function validateUserApiKeySecret(rawSecret) {
  const admin = getSupabaseServiceRole();
  if (!admin) return { ok: false };

  const key_hash = hashApiKeySecret(rawSecret);
  const { data, error } = await admin
    .from('amply_api_keys')
    .select('id, user_id')
    .eq('key_hash', key_hash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !data?.id) return { ok: false };

  void admin
    .from('amply_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return { ok: true, userId: data.user_id };
}

/** @param {string} userEmail */
export async function listUserApiKeys(userEmail) {
  const admin = getSupabaseServiceRole();
  if (!admin) return { keys: [], error: 'not_configured' };

  const { data, error } = await admin
    .from('amply_api_keys')
    .select('id, key_prefix, label, created_at, last_used_at')
    .eq('user_id', userEmail)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  if (error) return { keys: [], error: error.message };
  return { keys: data ?? [], error: null };
}

/**
 * @param {string} userEmail
 * @param {string} [label]
 * @returns {Promise<{ raw?: string, id?: string, prefix?: string, error?: string }>}
 */
export async function createUserApiKey(userEmail, label = null) {
  const admin = getSupabaseServiceRole();
  if (!admin) return { error: 'not_configured' };

  const { raw, prefix } = generateApiKeyMaterial();
  const key_hash = hashApiKeySecret(raw);

  const { data, error } = await admin
    .from('amply_api_keys')
    .insert({
      user_id: userEmail,
      key_hash,
      key_prefix: prefix,
      label: label?.trim() || null,
    })
    .select('id, key_prefix')
    .single();

  if (error) return { error: error.message };
  return { raw, id: data.id, prefix: data.key_prefix };
}

/**
 * @param {string} userEmail
 * @param {string} keyId uuid
 */
export async function revokeUserApiKey(userEmail, keyId) {
  const admin = getSupabaseServiceRole();
  if (!admin) return { ok: false, error: 'not_configured' };

  const { data: row } = await admin
    .from('amply_api_keys')
    .select('id')
    .eq('id', keyId)
    .eq('user_id', userEmail)
    .is('revoked_at', null)
    .maybeSingle();

  if (!row) return { ok: false, error: 'not_found' };

  const { error } = await admin
    .from('amply_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function isUserApiKeyStoreConfigured() {
  return getSupabaseServiceRole() != null;
}
