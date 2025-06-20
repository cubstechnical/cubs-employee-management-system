// Quick Test for Deployed Visa Function
// Run with: node quick-test.js

const https = require('https');

// Your deployed function URL
const FUNCTION_URL = 'https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications';

// You need to get your service role key from Supabase Dashboard
// Go to Settings → API → service_role key
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Replace with your actual key

function testFunction(data) {
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

async function runQuickTest() {
  console.log('🧪 Testing Deployed Visa Function\n');

  if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.log('❌ Please update the SERVICE_ROLE_KEY in this file');
    console.log('   Get it from: Supabase Dashboard → Settings → API → service_role key\n');
    return;
  }

  console.log('🔍 Testing manual trigger...');
  
  try {
    const result = await testFunction({ manual: true });
    console.log(`Status: ${result.status}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 200) {
      console.log('✅ Function is working!');
      console.log('📧 Check your email for notifications');
    } else {
      console.log('❌ Function returned an error');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

runQuickTest().catch(console.error); 