// ==========================================
// server/utils/digital-rights-web3.ts
// ==========================================

import { ethers } from "ethers";

const DIGITAL_RIGHTS_ABI = [
  "function registerWork(string memory _title, string memory _description, string memory _workType, string memory _ipfsHash, string memory _metadataHash, string memory _fileName, uint256 _fileSize, string memory _mimeType, string memory _originalLanguage) public returns (uint256)",
  "function getWork(uint256 workId) public view returns (uint256 id, address creator, string memory title, string memory description, string memory workType, string memory ipfsHash, string memory metadataHash, uint256 timestamp, bool isActive)",
  "function getWorkMetadata(uint256 workId) public view returns (string memory fileName, uint256 fileSize, string memory mimeType, string memory originalLanguage)",
  "function getCreatorWorks(address creator) public view returns (uint256[] memory)",
  "function deactivateWork(uint256 workId) public",
  "function getAllActiveWorks() public view returns (uint256[] memory)",
  "function verifyOwnership(uint256 workId, address creator) public view returns (bool)",
  "event WorkRegistered(uint256 indexed workId, address indexed creator, string title, string workType, string ipfsHash, uint256 timestamp)",
];

export function getDigitalRightsContract(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  const config = useRuntimeConfig();
  return new ethers.Contract(
    config.artekaContractAddress,
    DIGITAL_RIGHTS_ABI,
    signerOrProvider
  );
}

export async function registerWorkOnChain(
  privateKey: string,
  title: string,
  description: string,
  workType: string,
  ipfsHash: string,
  metadataHash: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  originalLanguage: string
) {
  const wallet = getWallet(privateKey);
  const contract = getDigitalRightsContract(wallet);

  const tx = await contract.registerWork(
    title,
    description,
    workType,
    ipfsHash,
    metadataHash,
    fileName,
    fileSize,
    mimeType,
    originalLanguage
  );

  const receipt = await tx.wait();

  // Parse the WorkRegistered event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "WorkRegistered";
    } catch {
      return false;
    }
  });

  let workId = null;
  if (event) {
    const parsed = contract.interface.parseLog(event);
    workId = parsed?.args[0];
  }

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    workId: workId ? Number(workId) : null,
  };
}

export async function getWorkFromChain(workId: number) {
  const provider = getProvider();
  const contract = getDigitalRightsContract(provider);

  const work = await contract.getWork(workId);
  const metadata = await contract.getWorkMetadata(workId);

  return {
    workId: Number(work[0]),
    creator: work[1],
    title: work[2],
    description: work[3],
    workType: work[4],
    ipfsHash: work[5],
    metadataHash: work[6],
    timestamp: Number(work[7]),
    isActive: work[8],
    metadata: {
      fileName: metadata[0],
      fileSize: Number(metadata[1]),
      mimeType: metadata[2],
      originalLanguage: metadata[3],
    },
  };
}

export async function getCreatorWorksFromChain(creatorAddress: string) {
  const provider = getProvider();
  const contract = getDigitalRightsContract(provider);

  const workIds = await contract.getCreatorWorks(creatorAddress);
  return workIds.map((id: any) => Number(id));
}

export async function getAllActiveWorksFromChain() {
  const provider = getProvider();
  const contract = getDigitalRightsContract(provider);

  const workIds = await contract.getAllActiveWorks();
  return workIds.map((id: any) => Number(id));
}

export async function verifyWorkOwnershipOnChain(
  workId: number,
  creatorAddress: string
) {
  const provider = getProvider();
  const contract = getDigitalRightsContract(provider);

  return await contract.verifyOwnership(workId, creatorAddress);
}

export async function deactivateWorkOnChain(
  privateKey: string,
  workId: number
) {
  const wallet = getWallet(privateKey);
  const contract = getDigitalRightsContract(wallet);

  const tx = await contract.deactivateWork(workId);
  const receipt = await tx.wait();

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}
