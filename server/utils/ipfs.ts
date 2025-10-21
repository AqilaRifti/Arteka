// server/utils/ipfs.ts
import axios from "axios";
import FormData from "form-data";

export async function uploadToIPFS(file: Buffer, fileName: string) {
  const config = useRuntimeConfig();

  const formData = new FormData();
  formData.append("file", file, fileName);

  const pinataMetadata = JSON.stringify({
    name: fileName,
  });
  formData.append("pinataMetadata", pinataMetadata);

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${config.PINATA_JWT_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );

    return {
      ipfsHash: res.data.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`,
    };
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error("Failed to upload to IPFS");
  }
}

export async function uploadJSONToIPFS(json: any) {
  const config = useRuntimeConfig();

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      json,
      {
        headers: {
          Authorization: `Bearer ${config.PINATA_JWT_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      ipfsHash: res.data.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`,
    };
  } catch (error) {
    console.error("IPFS JSON upload error:", error);
    throw new Error("Failed to upload JSON to IPFS");
  }
}
