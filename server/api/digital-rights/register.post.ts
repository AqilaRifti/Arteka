// File: server/api/digital-rights/register.post.ts
import { createClient } from "@supabase/supabase-js";
import { clerkClient } from "@clerk/nuxt/server";
import { ethers } from "ethers";
import pinataSDK from "@pinata/sdk";
import { Readable } from "stream"; // <-- use ESM import instead of require

const ARTEKA_CONTRACT_ADDRESS =
  process.env.ARTEKA_CONTRACT_ADDRESS ||
  "0x849F137657Ceb5C3C750a5BcB0d6EA76D5E65D00";
const SEPOLIA_RPC =
  process.env.SEPOLIA_RPC_URL ||
  "https://sepolia.infura.io/v3/fc854b36bd1044cbb4b7f30a5f9134c3";
const PRIVATE_KEY =
  process.env.DEPLOYER_PRIVATE_KEY ||
  "0xca932885c828487cc5e6117a1d5fcf8131cf234288410cf5ca55a5ee49639cba";

// Contract ABI (simplified for the registerWork function)
const CONTRACT_ABI = [
  "function registerWork(string memory _title, string memory _description, string memory _workType, string memory _ipfsHash, string memory _metadataHash, string memory _fileName, uint256 _fileSize, string memory _mimeType, string memory _originalLanguage) public returns (uint256)",
  "event WorkRegistered(uint256 indexed workId, address indexed creator, string title, string workType, string ipfsHash, uint256 timestamp)",
];
// server/api/digital-rights/register.post.ts
import { getAuth } from '@clerk/nuxt/server'

export default defineEventHandler(async (event) => {
  const auth = getAuth(event)
  
  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
  
  try {
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file uploaded'
      })
    }
    
    // Extract form fields
    let title = '', description = '', workType = '', language = '', privateKey = ''
    let file: any = null
    
    for (const part of formData) {
      if (part.name === 'file') {
        file = part
      } else if (part.name === 'title') {
        title = part.data.toString()
      } else if (part.name === 'description') {
        description = part.data.toString()
      } else if (part.name === 'workType') {
        workType = part.data.toString()
      } else if (part.name === 'language') {
        language = part.data.toString()
      } else if (part.name === 'privateKey') {
        privateKey = part.data.toString()
      }
    }
    
    if (!file || !title || !workType || !privateKey) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }
    
    // Get user
    const user = await getUserByClerkId(auth.userId)
    if (!user || !user.wallet_address) {
      throw createError({
        statusCode: 400,
        message: 'User wallet not configured'
      })
    }
    console.log(user.id)
    // Upload file to IPFS
    const config = useRuntimeConfig()
    const pinataFormData = new FormData()
    const blob = new Blob([file.data], { type: file.type || 'application/octet-stream' })
    pinataFormData.append('file', blob, file.filename)
    
    const pinataMetadata = JSON.stringify({
      name: file.filename,
      keyvalues: {
        creator: user.wallet_address,
        workType: workType,
        title: title
      }
    })
    pinataFormData.append('pinataMetadata', pinataMetadata)
    
    const fileUploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.pinataJwtKey}`
      },
      body: pinataFormData
    })
    
    if (!fileUploadResponse.ok) {
      throw new Error('Failed to upload file to IPFS')
    }
    
    const fileData = await fileUploadResponse.json()
    const ipfsHash = fileData.IpfsHash
    
    // Create metadata object
    const metadata = {
      title,
      description,
      workType,
      fileName: file.filename,
      fileSize: file.data.length,
      mimeType: file.type || 'application/octet-stream',
      originalLanguage: language,
      creator: user.wallet_address,
      createdAt: new Date().toISOString(),
      ipfsHash
    }
    
    // Upload metadata to IPFS
    const metadataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.pinataJwtKey}`
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${title}-metadata`
        }
      })
    })
    
    if (!metadataResponse.ok) {
      throw new Error('Failed to upload metadata to IPFS')
    }
    
    const metadataData = await metadataResponse.json()
    const metadataHash = metadataData.IpfsHash
    
    // Register on blockchain
    const result = await registerWorkOnChain(
      privateKey,
      title,
      description,
      workType,
      ipfsHash,
      metadataHash,
      file.filename,
      file.data.length,
      file.type || 'application/octet-stream',
      language
    )
    
    if (!result.workId) {
      throw createError({
        statusCode: 500,
        message: 'Failed to register work on blockchain'
      })
    }
    
    // Save to Supabase for indexing
    const work = await createDigitalWork({
      work_id: result.workId,
      creator_id: user.id,
      creator_wallet: user.wallet_address,
      title,
      description,
      work_type: workType,
      ipfs_hash: ipfsHash,
      metadata_hash: metadataHash,
      file_name: file.filename,
      file_size: file.data.length,
      mime_type: file.type || 'application/octet-stream',
      original_language: language,
      transaction_hash: result.transactionHash,
      block_number: result.blockNumber
    })
    
    return {
      success: true,
      work,
      ipfsUrl: `https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${ipfsHash}`,
      metadataUrl: `https://black-reasonable-mandrill-8.mypinata.cloud/ipfs/${metadataHash}`,
      transactionHash: result.transactionHash
    }
    
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})