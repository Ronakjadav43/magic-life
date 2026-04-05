import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🔄 Connecting to the database...');
  
  // We use the DATABASE_URL (port 6543) as the pooler should be accessible
  // For DDL statements, it's sometimes tricky in transaction-mode poolers,
  // but if we send queries strictly as non-prepared statements, it often works.
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set in the environment');
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('📦 Reading schema SQL...');
    const schemaPath = path.join(process.cwd(), 'prisma', 'supabase-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split statements by DO $$ ... END $$; and ;, but since we have plpgsql blocks, it's safer to just run the whole thing as one query or split it carefully.
    // The pg client can run the entire string at once!
    console.log('🛠️ Running schema SQL to create tables...');
    
    await client.query(schemaSql);
    
    console.log('✅ Tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
