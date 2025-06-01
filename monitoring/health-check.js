// monitoring/health-check.js
// Run this periodically to check app health

const fetch = require('node-fetch');

async function healthCheck() {
  const checks = [
    {
      name: 'Web App',
      url: 'https://your-domain.com',
      expected: 200
    },
    {
      name: 'Supabase',
      url: process.env.EXPO_PUBLIC_SUPABASE_URL + '/rest/v1/',
      expected: 200
    }
  ];

  for (const check of checks) {
    try {
      const response = await fetch(check.url);
      const status = response.status === check.expected ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
    }
  }
}

// Run health check
healthCheck();

// Schedule to run every 5 minutes
setInterval(healthCheck, 5 * 60 * 1000); 