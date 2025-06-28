import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from './firebase-admin';
import { prisma } from './prisma';
import { getUserRole, UserRoleEnum } from './prisma-enums';

type UserRole = keyof typeof UserRoleEnum;

export interface AuthUser {
  uid: string;
  email: string;
  dbUser: {
    id: string;
    email: string;
    role: UserRole;
    name: string | null;
  };
}

export async function requireAuth(request: NextRequest): Promise<AuthUser | NextResponse> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth().verifyIdToken(token);
    
    // Get or create user in database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid }
    });
    
    if (!user) {
      // Create user if they don't exist
      const newUser = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || '',
          name: decodedToken.name || null,
          role: getUserRole().USER
        }
      });
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        dbUser: newUser
      };
    }
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      dbUser: user
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid authentication token' },
      { status: 401 }
    );
  }
}

export async function requireModerator(request: NextRequest): Promise<AuthUser | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const UserRole = getUserRole();
  if (authResult.dbUser.role !== UserRole.MODERATOR && authResult.dbUser.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: 'Moderator access required' },
      { status: 403 }
    );
  }
  
  return authResult;
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const UserRole = getUserRole();
  if (authResult.dbUser.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }
  
  return authResult;
}

// Helper to check if user has permission for an action
export function hasPermission(userRole: UserRole, action: string): boolean {
  const UserRole = getUserRole();
  const permissions: Record<string, string[]> = {
    [UserRole.USER]: ['view', 'rate', 'review'],
    [UserRole.MODERATOR]: [
      'view', 'rate', 'review',
      'edit_entity', 'trigger_integration', 'edit_ai_summary',
      'view_moderator_logs'
    ],
    [UserRole.ADMIN]: [
      'view', 'rate', 'review',
      'edit_entity', 'trigger_integration', 'edit_ai_summary',
      'view_moderator_logs',
      'manage_users', 'delete_entity', 'manage_dimensions'
    ]
  };
  
  return permissions[userRole]?.includes(action) || false;
}