// Test script for new analytics endpoints
const baseUrl = 'https://aiyoutuber.vercel.app';  // Production URL
const endpoints = [
  '/api/analytics/themes?accountId=english_shots',
  '/api/analytics/audio?accountId=english_shots', 
  '/api/analytics/parameters?accountId=english_shots',
  '/api/analytics/ab-testing?accountId=english_shots'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Testing: ${endpoint}`);
    const response = await fetch(`${baseUrl}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Data keys:`, Object.keys(data));
      if (data.data) {
        console.log(`📈 Result keys:`, Object.keys(data.data));
      }
    } else {
      console.log(`❌ Error: ${response.status} - ${data.error}`);
      if (data.details) console.log(`💡 Details: ${data.details}`);
    }
  } catch (error) {
    console.log(`💥 Request failed: ${error.message}`);
  }
}

async function testAllEndpoints() {
  console.log('🚀 Testing new A/B Testing Analytics API endpoints...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between requests
  }
  
  console.log('\n✨ Test completed!');
}

testAllEndpoints().catch(console.error);