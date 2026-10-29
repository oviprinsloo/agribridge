/**
 * AgriBridge Database Schema Preparation Script
 * Automatically prepares Prisma schema based on DATABASE_URL (PostgreSQL vs SQLite)
 */
const fs = require('fs');
const path = require('path');

const prismaDir = path.join(__dirname, '..', 'prisma');
const schemaPath = path.join(prismaDir, 'schema.prisma');
const postgresSchemaPath = path.join(prismaDir, 'schema.postgresql.prisma');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || process.env.NODE_ENV === 'production';

// Ensure DIRECT_URL is populated for Neon if missing
if (isPostgres && !process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

if (isPostgres) {
  console.log('🐘 PostgreSQL detected (Neon/Production). Preparing PostgreSQL Prisma schema...');
  if (fs.existsSync(postgresSchemaPath)) {
    let content = fs.readFileSync(postgresSchemaPath, 'utf8');
    
    // If DIRECT_URL is not provided, ensure directUrl points to DATABASE_URL fallback
    if (!process.env.DIRECT_URL) {
      process.env.DIRECT_URL = process.env.DATABASE_URL;
    }

    fs.writeFileSync(schemaPath, content, 'utf8');
    console.log('✅ Prepared prisma/schema.prisma for PostgreSQL.');
  } else {
    console.warn('⚠️ schema.postgresql.prisma not found; keeping current schema.prisma.');
  }
} else {
  console.log('📁 SQLite detected (Local development). Ensuring SQLite Prisma schema...');
  if (fs.existsSync(schemaPath)) {
    const current = fs.readFileSync(schemaPath, 'utf8');
    if (current.includes('provider = "postgresql"')) {
      // Revert to sqlite for local dev if needed
      const sqliteContent = current
        .replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"')
        .replace(/\s*directUrl\s*=\s*env\("DIRECT_URL"\)/g, '');
      fs.writeFileSync(schemaPath, sqliteContent, 'utf8');
      console.log('✅ Adjusted prisma/schema.prisma for local SQLite development.');
    }
  }
}
