#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('Checking database schema...\n');
    
    // Check if we can query users with role
    const userCount = await prisma.user.count();
    console.log(`✓ Users table exists with ${userCount} users`);
    
    // Check if role field exists by querying a user
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      console.log(`✓ User role field exists: ${firstUser.role || 'No role set'}`);
    }
    
    // Check if moderator_logs table exists
    const logCount = await prisma.moderatorLog.count();
    console.log(`✓ ModeratorLog table exists with ${logCount} logs`);
    
    // Check if ScaryAnalysis has new fields
    const analysis = await prisma.scaryAnalysis.findFirst();
    if (analysis) {
      console.log(`✓ ScaryAnalysis table has new fields:`);
      console.log(`  - isHumanEdited: ${analysis.isHumanEdited}`);
      console.log(`  - whyScaryOriginal: ${analysis.whyScaryOriginal ? 'exists' : 'null'}`);
      console.log(`  - lastEditedById: ${analysis.lastEditedById || 'null'}`);
    }
    
    console.log('\n✅ Admin/Moderator schema is properly set up!');
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();