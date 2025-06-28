import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { getUserRole } from '@/lib/prisma-enums';

export const dynamic = 'force-dynamic';

// GET /api/admin/users - List all users with their roles
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') as string | null;
    
    const skip = (page - 1) * limit;
    
    const UserRole = getUserRole();
    const where = {
      ...(search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {}),
      ...(role && UserRole[role as keyof typeof UserRole] ? { role: UserRole[role as keyof typeof UserRole] } : {})
    };
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              ratings: true,
              reviews: true,
              moderatorLogs: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);
    
    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Update user role
export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { userId, role } = await request.json();
    
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }
    
    const UserRole = getUserRole();
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }
    
    // Prevent admin from removing their own admin role
    if (userId === authResult.dbUser.id && role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin role' },
        { status: 400 }
      );
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    });
    
    // Log the action
    await prisma.moderatorLog.create({
      data: {
        userId: authResult.dbUser.id,
        entityId: userId, // Using userId as entityId for user management actions
        action: 'EDIT_METADATA',
        details: {
          type: 'role_change',
          targetUserId: userId,
          oldRole: role === UserRole.ADMIN ? 'MODERATOR' : 'USER',
          newRole: role,
          performedBy: authResult.dbUser.email
        }
      }
    });
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Failed to update user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}