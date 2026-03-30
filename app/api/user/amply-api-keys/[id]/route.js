import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { revokeUserApiKey } from '@/app/lib/amplyRoute/userApiKeys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_req, context) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid key id' }, { status: 400 });
    }

    const result = await revokeUserApiKey(email, id);
    if (result.error === 'not_configured') {
      return NextResponse.json({ error: 'API key store not configured' }, { status: 503 });
    }
    if (result.error === 'not_found') {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    if (!result.ok) {
      return NextResponse.json({ error: 'Revoke failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to revoke key' },
      { status: 500 },
    );
  }
}
