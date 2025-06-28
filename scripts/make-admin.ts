#!/usr/bin/env tsx

/**
 * Script to make a user an admin
 * Usage: npm run make-admin <email>
 */

import { PrismaClient } from '@prisma/client';
import { getUserRole } from '../src/lib/prisma-enums';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    const UserRole = getUserRole();
    
    if (user.role === UserRole.ADMIN) {
      console.log(`User ${email} is already an admin`);
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN }
    });

    console.log(`Successfully made ${email} an admin`);
    console.log('User details:', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line args
const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run make-admin <email>');
  console.error('Example: npm run make-admin user@example.com');
  process.exit(1);
}

makeAdmin(email);