import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import B2 from "npm:backblaze-b2";

// Helper to parse JSON body
async function parseJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

// Helper to verify Supabase JWT (optional for now)
async function getUser(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  
  try {
    // Supabase provides a JWT verification endpoint
    const res = await fetch(Deno.env.get("SUPABASE_URL") + "/auth/v1/user", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

serve(async (req) => {
  try {
    // Set CORS headers - CRITICAL for fixing the CORS issues
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    };

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Parse request body
    const body = await parseJson(req);
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/|\/$/g, "");

    // Determine action - support both URL-based and body-based routing
    let action = body?.action;
    if (!action) {
      if (path.endsWith("upload")) action = "upload";
      else if (path.endsWith("download")) action = "download";
      else if (path.endsWith("list")) action = "list";
      else action = "list"; // default to list for document loading
    }

    // --- AUTH CHECK (Optional for now - can be enabled later) ---
    // const user = await getUser(req);
    // if (!user && action !== "list") {
    //   return new Response(JSON.stringify({
    //     error: "Unauthorized"
    //   }), {
    //     status: 401,
    //     headers: { ...corsHeaders, "Content-Type": "application/json" }
    //   });
    // }

    // Initialize B2
    const b2 = new B2({
      applicationKeyId: Deno.env.get("B2_KEY_ID"),
      applicationKey: Deno.env.get("B2_APPLICATION_KEY")
    });
    await b2.authorize();

    const bucketId = Deno.env.get("B2_BUCKET_ID");
    const bucketName = Deno.env.get("B2_BUCKET_NAME");

    // --- UPLOAD ---
    if (action === "upload") {
      if (!body?.fileName || !body?.fileData) {
        return new Response(JSON.stringify({
          error: "Missing fileName or fileData"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Get upload URL & auth token
      const { uploadUrl, authorizationToken } = await b2.getUploadUrl({
        bucketId
      });

      // Decode base64 file data
      const fileBuffer = Uint8Array.from(atob(body.fileData), (c) => c.charCodeAt(0));

      // Upload file
      const uploadRes = await b2.uploadFile({
        uploadUrl,
        uploadAuthToken: authorizationToken,
        fileName: body.fileName,
        data: fileBuffer,
        mime: body.mimeType || "application/octet-stream"
      });

      return new Response(JSON.stringify({
        fileId: uploadRes.fileId,
        fileName: uploadRes.fileName
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // --- LIST FILES (NEW - needed for fixing document loading) ---
    if (action === "list") {
      const prefix = body?.prefix || `employees/${body?.employeeId}/`;
      
      try {
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
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("List files error:", error);
        return new Response(JSON.stringify({ 
          files: [], 
          error: "Failed to list files" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // --- DOWNLOAD (signed URL) ---
    if (action === "download") {
      if (!body?.fileName) {
        return new Response(JSON.stringify({
          error: "Missing fileName"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Generate a download authorization token (valid for 1 hour)
      const { authorizationToken } = await b2.getDownloadAuthorization({
        bucketId,
        fileNamePrefix: body.fileName,
        validDurationInSeconds: 3600
      });

      const { downloadUrl } = b2;
      const url = `${downloadUrl}/file/${bucketName}/${body.fileName}?Authorization=${authorizationToken}`;

      return new Response(JSON.stringify({
        url
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // --- DEFAULT: Return success info ---
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