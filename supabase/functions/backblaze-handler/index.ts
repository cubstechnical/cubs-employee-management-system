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
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/|\/$/g, ""); // remove leading/trailing slashes

  // Initialize B2
  const b2 = new B2({
    applicationKeyId: Deno.env.get("B2_KEY_ID")!,
    applicationKey: Deno.env.get("B2_APPLICATION_KEY")!,
  });
  await b2.authorize();

  const bucketId = Deno.env.get("B2_BUCKET_ID")!;
  const bucketName = Deno.env.get("B2_BUCKET_NAME")!;

  // --- UPLOAD ---
  if (path.endsWith("upload")) {
    // Expecting JSON: { fileName: string, fileData: string (base64), mimeType?: string }
    const body = await parseJson(req);
    if (!body?.fileName || !body?.fileData) {
      return new Response(JSON.stringify({ error: "Missing fileName or fileData" }), { status: 400 });
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
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- DOWNLOAD (signed URL) ---
  if (path.endsWith("download")) {
    // Expecting JSON: { fileName: string }
    const body = await parseJson(req);
    if (!body?.fileName) {
      return new Response(JSON.stringify({ error: "Missing fileName" }), { status: 400 });
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
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Not Found ---
  return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
});