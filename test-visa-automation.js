// Test Script for Visa Automation
// Run with: node test-visa-automation.js

const https = require('https');

// Your Supabase project details
const SUPABASE_URL = 'https://tndfjsjemqjgagtsqudr.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-visa-notifications`;

// You'll need to get your service role key from Supabase Dashboard
// Go to Settings → API → service_role key
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Replace with your actual key

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'tndfjsjemqjgagtsqudr.supabase.co',
      port: 443,
      path: '/functions/v1/send-visa-notifications',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Visa Automation System\n');

  if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.log('❌ Please update the SERVICE_ROLE_KEY in this file');
    console.log('   Get it from: Supabase Dashboard → Settings → API → service_role key\n');
    return;
  }

  const tests = [
    {
      name: 'Test 1: Manual Trigger (All Employees)',
      data: { manual: true }
    },
    {
      name: 'Test 2: Check 30-day Interval',
      data: { interval: 30 }
    },
    {
      name: 'Test 3: Check 7-day Interval',
      data: { interval: 7 }
    },
    {
      name: 'Test 4: Check 1-day Interval',
      data: { interval: 1 }
    }
  ];

  for (const test of tests) {
    console.log(`\n🔍 ${test.name}`);
    console.log('Request data:', JSON.stringify(test.data, null, 2));
    
    try {
      const result = await makeRequest(test.data);
      console.log(`Status: ${result.status}`);
      console.log('Response:', JSON.stringify(result.data, null, 2));
      
      if (result.status === 200) {
        console.log('✅ Test passed');
      } else {
        console.log('❌ Test failed');
      }
    } catch (error) {
      console.log('❌ Test failed with error:', error.message);
    }
    
    console.log('─'.repeat(50));
  }

  console.log('\n📋 Test Summary:');
  console.log('1. If all tests return 200 status, your function is working');
  console.log('2. Check the response data for employee details');
  console.log('3. Verify emails are being sent to your configured address');
  console.log('4. Check Supabase logs for detailed execution info');
}

// Run the tests
runTests().catch(console.error); 