// scripts/migrate.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const migrationsDir = path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found. Skipping.');
    return;
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Create migrations table if it doesn't exist
  await (supabase as any).rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
  });

  for (const file of migrationFiles) {
    const { name } = path.parse(file);

    // Check if already executed
    const { data: existing } = await supabase
      .from('migrations')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      console.log(`✓ ${name} (already applied)`);
      continue;
    }

    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      // Execute migration
      const { error } = await (supabase as any).rpc('exec', { sql });
      if (error) throw error;

      // Record migration
      await supabase
        .from('migrations')
        .insert({ name });

      console.log(`✓ ${name}`);
    } catch (error) {
      console.error(`✗ ${name}`, error);
      throw error;
    }
  }

  console.log('\n✅ All migrations completed!');
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
