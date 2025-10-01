require('dotenv').config({ path: '.env.local' });

async function testDeepSeek() {
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Say "DeepSeek API is working" if you can read this.'
          }
        ],
        max_tokens: 20
      })
    });

    if (!response.ok) {
      console.log('❌ DeepSeek API failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ DeepSeek API is working!');
    console.log('Response:', data.choices[0]?.message?.content || 'No content');
  } catch (error) {
    console.log('❌ DeepSeek API error:', error.message);
  }
}

testDeepSeek();