const { connectDb } = require('./lib/database');

async function testHooks() {
  try {
    const db = await connectDb();
    const result = await db.query(`
      SELECT data->'content' as content 
      FROM quiz_jobs 
      WHERE account_id = 'health_shots' 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('Recent health content with dynamic hooks:');
    result.rows.forEach((row, i) => {
      console.log(`\n=== Entry ${i+1} ===`);
      const content = row.content;
      if (content?.hook) console.log('Hook:', content.hook);
      if (content?.question) console.log('Question:', content.question);
      if (content?.content) console.log('Content:', content.content);
      if (content?.options) {
        console.log('Options:', Object.keys(content.options).map(key => `${key}: ${content.options[key]}`).join(', '));
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error);
    process.exit(1);
  }
}

testHooks();