import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { 
  retrieveUserMemory, 
  getMemorySummary, 
  cleanupOldMemories,
  MEMORY_CATEGORIES 
} from '../../../services/aiMemoryService.js';

export async function GET(req) {
  try {
    // In development mode, bypass authentication
    const isDev = process.env.NODE_ENV === 'development';
    
    let userEmail;
    if (isDev) {
      userEmail = 'dev@local.com';
    } else {
      try {
        // Get the current session
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
          return Response.json({ error: 'Unauthorised' }, { status: 401 });
        }
        userEmail = session.user.email;
      } catch (authError) {
        console.error('Auth error:', authError);
        return Response.json({ error: 'Authentication error' }, { status: 401 });
      }
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const includeSummary = searchParams.get('summary') === 'true';

    // Retrieve user memory
    const memories = await retrieveUserMemory(userEmail, category, limit);
    
    // Get memory summary if requested
    let summary = null;
    if (includeSummary) {
      summary = await getMemorySummary(userEmail);
    }

    return Response.json({
      memories,
      summary,
      categories: MEMORY_CATEGORIES,
      userEmail
    });

  } catch (error) {
    console.error('Error in memory API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    // In development mode, bypass authentication
    const isDev = process.env.NODE_ENV === 'development';
    
    let userEmail;
    if (isDev) {
      userEmail = 'dev@local.com';
    } else {
      try {
        // Get the current session
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
          return Response.json({ error: 'Unauthorised' }, { status: 401 });
        }
        userEmail = session.user.email;
      } catch (authError) {
        console.error('Auth error:', authError);
        return Response.json({ error: 'Authentication error' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const daysOld = parseInt(searchParams.get('daysOld')) || 90;

    // Clean up old memories
    const result = await cleanupOldMemories(userEmail, daysOld);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} old memory records`
    });

  } catch (error) {
    console.error('Error in memory cleanup API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 