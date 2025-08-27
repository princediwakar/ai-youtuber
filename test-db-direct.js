const { Client } = require('pg');

async function testDatabaseConnection() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_iTD3xcFj2WPX@ep-lucky-smoke-ad12pllj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const timeResult = await client.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('Current time and DB:', timeResult.rows[0]);
    
    // Test pending jobs query
    const jobsResult = await client.query(`
      SELECT id, step, status, persona, category, created_at 
      FROM quiz_jobs 
      WHERE step = 2 AND status LIKE '%pending%'
      ORDER BY created_at ASC 
      LIMIT 10
    `);
    
    console.log(`Found ${jobsResult.rows.length} pending jobs for Step 2:`);
    jobsResult.rows.forEach((job, i) => {
      console.log(`  ${i + 1}. ${job.id} - ${job.status} (${job.created_at})`);
    });
    
    // Test the exact getPendingJobs logic
    const exactQuery = `
      SELECT * FROM quiz_jobs 
      WHERE step = $1 AND status LIKE '%pending%'
      ORDER BY created_at ASC 
      LIMIT $2
    `;
    const exactResult = await client.query(exactQuery, [2, 1]);
    console.log(`\nExact getPendingJobs query result: ${exactResult.rows.length} rows`);
    if (exactResult.rows.length > 0) {
      console.log('First row:', exactResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testDatabaseConnection();