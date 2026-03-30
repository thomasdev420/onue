import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import {
  createUserApiKey,
  listUserApiKeys,
} from '@/app/lib/amplyRoute/userApiKeys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keys, error } = await listUserApiKeys(email);
    if (error === 'not_configured') {
      return NextResponse.json(
        { error: 'API key store not configured', keys: [] },
        { status: 503 },
      );
    }
    if (error) {
      return NextResponse.json({ error, keys: [] }, { status: 500 });
    }
    return NextResponse.json({ keys });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list keys' },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let label = null;
    try {
      const body = await req.json();
      label = typeof body?.label === 'string' ? body.label : null;
    } catch {
      /* empty body ok */
    }

    const result = await createUserApiKey(email, label);
    if (result.error === 'not_configured') {
      return NextResponse.json({ error: 'API key store not configured' }, { status: 503 });
    }
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      id: result.id,
      key_prefix: result.prefix,
      api_key: result.raw,
      message: 'Save this key now; it will not be shown again.',
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create key' },
      { status: 500 },
    );
  }
}
