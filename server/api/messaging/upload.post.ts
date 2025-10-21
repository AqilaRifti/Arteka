// server/api/messaging/upload.post.ts
import { getAuth } from "@clerk/nuxt/server";

export default defineEventHandler(async (event) => {
  const auth = getAuth(event);

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  try {
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: "No file uploaded",
      });
    }

    const file = formData[0];

    if (!file.filename || !file.data) {
      throw createError({
        statusCode: 400,
        message: "Invalid file data",
      });
    }

    // Upload to Pinata
    const config = useRuntimeConfig();
    const pinataFormData = new FormData();
    const blob = new Blob([file.data], {
      type: file.type || "application/octet-stream",
    });
    pinataFormData.append("file", blob, file.filename);

    const pinataResponse = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.pinataJwtKey}`,
        },
        body: pinataFormData,
      }
    );

    if (!pinataResponse.ok) {
      throw new Error("Failed to upload to Pinata");
    }

    const pinataData = await pinataResponse.json();

    return {
      success: true,
      fileData: {
        url: `https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${pinataData.IpfsHash}`,
        name: file.filename,
        size: file.data.length,
        type: file.type || "application/octet-stream",
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
