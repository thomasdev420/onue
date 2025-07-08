import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route.js";

export async function GET(request) {
  console.log('🧪 Test session endpoint called');
  
  try {
    const session = await getServerSession(authOptions);
    
    const result = {
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      session: session ? {
        user: session.user ? {
          email: session.user.email,
          name: session.user.name,
          id: session.user.id
        } : null,
        expires: session.expires,
        provider: session.provider
      } : null,
      cookies: Object.fromEntries(request.headers.get('cookie')?.split(';').map(c => {
        const [key, value] = c.trim().split('=');
        return [key, value];
      }) || []),
      headers: Object.fromEntries(request.headers.entries())
    };
    
    console.log('📋 Session test result:', result);
    
    return Response.json(result, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('❌ Session test error:', error);
    
    return Response.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
} 