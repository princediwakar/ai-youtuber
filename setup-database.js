const { Pool } = require('pg');
const fs = require('fs');

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    
    // Read the schema file
    const schema = fs.readFileSync('./database/schema.sql', 'utf8');
    
    // Execute the schema
    console.log('Creating tables and functions...');
    await pool.query(schema);
    
    console.log('✅ Database schema setup completed successfully!');
    
    // Test the setup
    console.log('Testing job stats function...');
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status LIKE '%pending%' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM quiz_jobs
    `);
    
    console.log('Database stats:', result.rows[0]);
    console.log('✅ Database is ready for quiz generation!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

setupDatabase();