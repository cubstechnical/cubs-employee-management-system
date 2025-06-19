import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
};

// Cache for Backblaze auth to reduce API calls
let authCache = null;

// Helper function to calculate SHA1 hash
async function calculateSHA1(data) {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b)=>b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Helper function to retry API calls with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  for(let attempt = 0; attempt <= maxRetries; attempt++){
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        throw lastError;
      }
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms`);
      await new Promise((resolve)=>setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// Get or refresh Backblaze authentication
async function getBackblazeAuth() {
  const now = Date.now();
  // Check if we have valid cached auth (expires after 23 hours)
  if (authCache && authCache.expiresAt > now) {
    console.log('✅ Using cached Backblaze auth');
    return {
      authData: authCache.data,
      bucketId: authCache.bucketId
    };
  }

  console.log('🔑 Getting fresh Backblaze auth...');
  const applicationKeyId = Deno.env.get('B2_APPLICATION_KEY_ID');
  const applicationKey = Deno.env.get('B2_APPLICATION_KEY');
  const bucketName = 'cubsdocs';

  if (!applicationKeyId || !applicationKey) {
    throw new Error('Missing Backblaze credentials');
  }

  // Authenticate with retry logic
  const authData = await retryWithBackoff(async ()=>{
    const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${applicationKeyId}:${applicationKey}`)}`
      }
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(`Backblaze auth failed: ${authResponse.status} ${errorText}`);
    }

    return await authResponse.json();
  });

  // Get bucket ID with retry logic
  const bucketId = await retryWithBackoff(async ()=>{
    const bucketsResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_buckets`, {
      method: 'POST',
      headers: {
        'Authorization': authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId: authData.accountId
      })
    });

    if (!bucketsResponse.ok) {
      const errorText = await bucketsResponse.text();
      throw new Error(`Failed to list buckets: ${bucketsResponse.status} ${errorText}`);
    }

    const bucketsData = await bucketsResponse.json();
    const bucket = bucketsData.buckets.find((b)=>b.bucketName === bucketName);

    if (!bucket) {
      throw new Error(`Bucket ${bucketName} not found`);
    }

    return bucket.bucketId;
  });

  // Cache the auth for 23 hours
  authCache = {
    data: authData,
    bucketId: bucketId,
    expiresAt: now + (23 * 60 * 60 * 1000) // 23 hours
  };

  console.log('✅ Backblaze auth cached successfully');
  return { authData, bucketId };
}

serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') }
        }
      }
    );

    // Get the user from the request
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, empId, fileName, fileContent, contentType, folderName } = await req.json();
    console.log('📋 Action:', action, 'Employee:', empId, 'File:', fileName, 'Folder:', folderName);

    // Validate required fields for upload
    if (action === 'upload') {
      if (!fileName || !fileContent || !empId) {
        console.error('❌ Missing required fields:', {
          fileName: !!fileName,
          fileContent: !!fileContent,
          empId: !!empId
        });
        return new Response(JSON.stringify({
          success: false,
          error: 'File name, type, and content are required for upload',
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get cached Backblaze authentication
    const { authData, bucketId } = await getBackblazeAuth();

    if (action === 'upload') {
      // Handle file upload with retry logic
      try {
        // Get upload URL with retry
        const uploadUrlData = await retryWithBackoff(async ()=>{
          const uploadUrlResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: {
              'Authorization': authData.authorizationToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bucketId })
          });

          if (!uploadUrlResponse.ok) {
            const errorText = await uploadUrlResponse.text();
            throw new Error(`Failed to get upload URL: ${uploadUrlResponse.status} ${errorText}`);
          }

          return await uploadUrlResponse.json();
        });

        // Prepare file path
        const actualFolderName = folderName || `EMP_${empId}`; // Use provided folderName or fallback
        const filePath = `${actualFolderName}/${fileName}`;

        // Convert base64 to binary
        const binaryData = Uint8Array.from(atob(fileContent), (c)=>c.charCodeAt(0));

        // Calculate SHA1 hash
        const sha1Hash = await calculateSHA1(binaryData);

        // Upload file with retry logic
        const uploadResult = await retryWithBackoff(async ()=>{
          const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': uploadUrlData.authorizationToken,
              'X-Bz-File-Name': encodeURIComponent(filePath),
              'Content-Type': contentType || 'application/octet-stream',
              'X-Bz-Content-Sha1': sha1Hash,
              'X-Bz-Info-Author': user.email || 'unknown'
            },
            body: binaryData
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
          }

          return await uploadResponse.json();
        });

        console.log('✅ File uploaded successfully:', uploadResult.fileName);

        // Save to database with correct field names
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueFilePath = `${filePath}_${timestamp}`;

        const { error: dbError } = await supabaseClient
          .from('employee_documents')
          .insert({
            employee_id: empId,
            document_type: 'other',
            file_name: fileName,
            file_url: `https://f005.backblazeb2.com/file/cubsdocs/${filePath}`,
            file_size: binaryData.length,
            mime_type: contentType || 'application/octet-stream',
            uploaded_by: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            expiry_date: null,
            notes: null,
            document_number: '',
            issuing_authority: ''
          });

        if (dbError) {
          console.error('❌ Database save failed:', dbError);
          // Don't fail the upload if database save fails
        } else {
          console.log('✅ Document metadata saved to database');
        }

        return new Response(JSON.stringify({
          success: true,
          fileId: uploadResult.fileId,
          fileName: uploadResult.fileName,
          fileUrl: `https://f005.backblazeb2.com/file/cubsdocs/${filePath}`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Upload error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (action === 'getSignedUrl') {
      // Handle getting signed URL for document viewing/downloading
      try {
        if (!fileName || !empId) {
          throw new Error('File name and employee ID are required');
        }

        // Use folderName if provided, otherwise construct from empId
        const actualFolderName = folderName || `EMP_${empId}`;
        const filePath = `${actualFolderName}/${fileName}`;

        console.log('🔗 Generating signed URL for:', filePath);

        // Get download authorization with retry
        const downloadAuthData = await retryWithBackoff(async ()=>{
          const downloadAuthResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_download_authorization`, {
            method: 'POST',
            headers: {
              'Authorization': authData.authorizationToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bucketId: bucketId,
              fileNamePrefix: filePath,
              validDurationInSeconds: 3600 // 1 hour
            })
          });

          if (!downloadAuthResponse.ok) {
            const errorText = await downloadAuthResponse.text();
            throw new Error(`Download authorization failed: ${downloadAuthResponse.status} ${errorText}`);
          }

          return await downloadAuthResponse.json();
        });

        // Construct signed URL with proper format
        const encodedFileName = encodeURIComponent(fileName);
        const signedUrl = `${authData.downloadUrl}/file/cubsdocs/${actualFolderName}/${encodedFileName}?Authorization=${downloadAuthData.authorizationToken}`;

        console.log('✅ Generated signed URL successfully');

        return new Response(JSON.stringify({
          success: true,
          signedUrl: signedUrl,
          filePath: filePath,
          expiresIn: 3600
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });

      } catch (error) {
        console.error('❌ Error generating signed URL:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to generate signed URL: ${error.message}`,
          suggestion: 'Please check if the file exists and you have proper permissions'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }

    if (action === 'delete') {
      // Handle file deletion with retry logic
      try {
        const { filePath } = await req.json();
        if (!filePath) {
          throw new Error('File path is required for deletion');
        }

        console.log('🗑️ Deleting file from Backblaze:', filePath);

        // Get file info first with retry
        const fileInfoData = await retryWithBackoff(async ()=>{
          const fileInfoResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_file_names`, {
            method: 'POST',
            headers: {
              'Authorization': authData.authorizationToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bucketId,
              startFileName: filePath,
              maxFileCount: 1,
              prefix: filePath
            })
          });

          if (!fileInfoResponse.ok) {
            const errorText = await fileInfoResponse.text();
            throw new Error(`Failed to get file info: ${fileInfoResponse.status} ${errorText}`);
          }

          return await fileInfoResponse.json();
        });

        if (!fileInfoData.files || fileInfoData.files.length === 0) {
          console.warn('⚠️ File not found for deletion:', filePath);
          return new Response(JSON.stringify({
            success: true,
            message: 'File not found in storage (may already be deleted)'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const fileInfo = fileInfoData.files[0];

        // Delete the file with retry
        await retryWithBackoff(async ()=>{
          const deleteResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_delete_file_version`, {
            method: 'POST',
            headers: {
              'Authorization': authData.authorizationToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileId: fileInfo.fileId,
              fileName: fileInfo.fileName
            })
          });

          if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            throw new Error(`Failed to delete file: ${deleteResponse.status} ${errorText}`);
          }

          return await deleteResponse.json();
        });

        console.log('✅ File deleted from Backblaze successfully');

        return new Response(JSON.stringify({
          success: true,
          message: 'File deleted successfully'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Delete error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 