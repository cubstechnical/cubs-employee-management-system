// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Backblaze B2 Signed URL Generator
// This Edge Function generates signed URLs for secure file downloads from Backblaze B2

interface B2AuthResponse {
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
}

interface B2DownloadAuthResponse {
  authorizationToken: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getB2AuthToken(): Promise<B2AuthResponse> {
  const applicationKeyId = Deno.env.get('B2_APPLICATION_KEY_ID');
  const applicationKey = Deno.env.get('B2_APPLICATION_KEY');
  
  if (!applicationKeyId || !applicationKey) {
    throw new Error('B2 credentials not configured');
  }

  const credentials = btoa(`${applicationKeyId}:${applicationKey}`);
  
  const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`B2 authorization failed: ${error}`);
  }

  return await response.json();
}

async function getDownloadAuthorization(apiUrl: string, authToken: string, bucketId: string): Promise<B2DownloadAuthResponse> {
  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_download_authorization`, {
    method: 'POST',
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketId: bucketId,
      fileNamePrefix: '',
      validDurationInSeconds: 3600 // 1 hour
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Download authorization failed: ${error}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileUrl, expirationMinutes = 60 } = await req.json();
    
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'fileUrl is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log('Generating signed URL for:', fileUrl);

    // Extract bucket and file info from URL
    // URL format: https://f005.backblazeb2.com/file/bucketname/filepath
    const urlMatch = fileUrl.match(/https:\/\/[^\/]+\/file\/([^\/]+)\/(.+)/);
    if (!urlMatch) {
      throw new Error('Invalid Backblaze URL format');
    }

    const [, bucketName, filePath] = urlMatch;
    console.log('Bucket:', bucketName, 'File:', filePath);

    // Get B2 authorization
    const authData = await getB2AuthToken();
    console.log('Got B2 auth token');

    // For public buckets, we can create a simple signed URL
    // For private buckets, we need download authorization
    const bucketId = Deno.env.get('B2_BUCKET_ID') || '';
    
    if (bucketId) {
      // Get download authorization for private bucket
      const downloadAuth = await getDownloadAuthorization(authData.apiUrl, authData.authorizationToken, bucketId);
      
      // Create signed URL with authorization token
      const signedUrl = `${fileUrl}?Authorization=${downloadAuth.authorizationToken}`;
      
      return new Response(
        JSON.stringify({ 
          signedUrl: signedUrl,
          expiresIn: expirationMinutes * 60,
          success: true 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } else {
      // For public buckets or fallback, return original URL
      console.log('No bucket ID configured, returning original URL');
      
      return new Response(
        JSON.stringify({ 
          signedUrl: fileUrl,
          expiresIn: expirationMinutes * 60,
          success: true,
          note: 'Public bucket - no authorization needed'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

  } catch (error) {
    console.error('Error generating signed URL:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

/* To test locally:
  
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/backblaze-signed-url' \
    --header 'Authorization: Bearer [your-jwt-token]' \
    --header 'Content-Type: application/json' \
    --data '{"fileUrl":"https://f005.backblazeb2.com/file/cubsdocs/path/to/file.pdf","expirationMinutes":60}'

*/
