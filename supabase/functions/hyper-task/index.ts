import { serve } from "std/server";
import B2 from "npm:backblaze-b2";

// Helper to parse JSON body
async function parseJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

serve(async (req) => {
  try {
    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    };

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const body = await parseJson(req);
    
    // If no action is specified, default to list
    const action = body?.action || 'list';

    // Initialize B2
    const b2 = new B2({
      applicationKeyId: Deno.env.get("B2_KEY_ID")!,
      applicationKey: Deno.env.get("B2_APPLICATION_KEY")!,
    });
    await b2.authorize();

    const bucketId = Deno.env.get("B2_BUCKET_ID")!;
    const bucketName = Deno.env.get("B2_BUCKET_NAME")!;

    // --- UPLOAD ---
    if (action === "upload") {
      if (!body?.fileName || !body?.fileData) {
        return new Response(JSON.stringify({ error: "Missing fileName or fileData" }), { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Get upload URL & auth token
      const { uploadUrl, authorizationToken } = await b2.getUploadUrl({ bucketId });

      // Decode base64 file data
      const fileBuffer = Uint8Array.from(atob(body.fileData), c => c.charCodeAt(0));

      // Upload file
      const uploadRes = await b2.uploadFile({
        uploadUrl,
        uploadAuthToken: authorizationToken,
        fileName: body.fileName,
        data: fileBuffer,
        mime: body.mimeType || "application/octet-stream",
      });

      return new Response(JSON.stringify({ fileId: uploadRes.fileId, fileName: uploadRes.fileName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- LIST FILES ---
    if (action === "list") {
      const prefix = body?.prefix || `employees/${body?.employeeId}/`;
      
      const listResponse = await b2.listFileNames({
        bucketId,
        startFileName: prefix,
        maxFileCount: 100,
        prefix: prefix,
      });

      const files = listResponse.files.map(file => ({
        fileId: file.fileId,
        fileName: file.fileName,
        contentType: file.contentType,
        contentLength: file.contentLength,
        uploadTimestamp: file.uploadTimestamp,
        url: `${b2.downloadUrl}/file/${bucketName}/${file.fileName}`
      }));

      return new Response(JSON.stringify({ files }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- DOWNLOAD (signed URL) ---
    if (action === "download") {
      if (!body?.fileName) {
        return new Response(JSON.stringify({ error: "Missing fileName" }), { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Generate a download authorization token (valid for 1 hour)
      const { authorizationToken } = await b2.getDownloadAuthorization({
        bucketId,
        fileNamePrefix: body.fileName,
        validDurationInSeconds: 3600,
      });

      const { downloadUrl } = b2;
      const url = `${downloadUrl}/file/${bucketName}/${body.fileName}?Authorization=${authorizationToken}`;

      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- DEFAULT: Return success for any other requests ---
    return new Response(JSON.stringify({ 
      message: "CUBS Backblaze Handler - Ready",
      supportedActions: ["upload", "list", "download"],
      timestamp: new Date().toISOString()
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Hyper-task handler error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
    });
  }
}); 