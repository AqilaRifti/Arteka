// server/utils/web3.ts
import { ethers } from "ethers";

const MARKETPLACE_ABI = [
  "function createListing(uint256 _workId, string memory _listingType, string memory _title, string memory _description, uint256 _price) public returns (uint256)",
  "function purchaseListing(uint256 _listingId) public payable returns (uint256)",
  "function deactivateListing(uint256 _listingId) public",
  "function getListing(uint256 _listingId) public view returns (uint256 listingId, uint256 workId, address seller, string memory listingType, string memory title, string memory description, uint256 price, bool isActive, uint256 createdAt, uint256 soldCount)",
  "function getSellerListings(address _seller) public view returns (uint256[] memory)",
  "function getBuyerPurchases(address _buyer) public view returns (uint256[] memory)",
  "event ListingCreated(uint256 indexed listingId, address indexed seller, string listingType, uint256 price, uint256 timestamp)",
  "event PurchaseMade(uint256 indexed purchaseId, uint256 indexed listingId, address indexed buyer, address seller, uint256 price, uint256 timestamp)",
];

const MESSAGING_ABI = [
  "function createConversation(address _participant2, uint256 _listingId) public returns (uint256)",
  "function sendMessage(uint256 _conversationId, string memory _encryptedContent, string memory _encryptedKey) public returns (uint256)",
  "function unlockMessageForEvidence(uint256 _messageId, string memory _decryptionKey) public",
  "function getConversationMessages(uint256 _conversationId) public view returns (uint256[] memory)",
  "function getMessage(uint256 _messageId) public view returns (uint256 messageId, uint256 conversationId, address sender, string memory encryptedContent, string memory encryptedKey, uint256 timestamp, bool isUnlocked)",
  "function findConversation(address _participant) public view returns (uint256)",
  "event ConversationCreated(uint256 indexed conversationId, address indexed participant1, address indexed participant2, uint256 listingId, uint256 timestamp)",
  "event MessageSent(uint256 indexed messageId, uint256 indexed conversationId, address indexed sender, uint256 timestamp)",
];

export function getProvider() {
  const config = useRuntimeConfig();
  return new ethers.JsonRpcProvider(config.sepoliaRpcUrl);
}

export function getWallet(privateKey: string) {
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

export function getMarketplaceContract(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  const config = useRuntimeConfig();
  return new ethers.Contract(
    config.marketplaceContractAddress,
    MARKETPLACE_ABI,
    signerOrProvider
  );
}

export function getMessagingContract(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  const config = useRuntimeConfig();
  return new ethers.Contract(
    config.messagingContractAddress,
    MESSAGING_ABI,
    signerOrProvider
  );
}

export async function createListingOnChain(
  privateKey: string,
  workId: number,
  listingType: string,
  title: string,
  description: string,
  priceInEth: string
) {
  const wallet = getWallet(privateKey);
  const contract = getMarketplaceContract(wallet);

  const priceInWei = ethers.parseEther(priceInEth);

  const tx = await contract.createListing(
    workId,
    listingType,
    title,
    description,
    priceInWei
  );

  const receipt = await tx.wait();

  // Parse the ListingCreated event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "ListingCreated";
    } catch {
      return false;
    }
  });

  let listingId = null;
  if (event) {
    const parsed = contract.interface.parseLog(event);
    listingId = parsed?.args[0];
  }

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    listingId: listingId ? Number(listingId) : null,
  };
}

export async function purchaseListingOnChain(
  privateKey: string,
  listingId: number,
  priceInWei: string
) {
  const wallet = getWallet(privateKey);
  const contract = getMarketplaceContract(wallet);
  console.log(listingId)
  const tx = await contract.purchaseListing(listingId, {
    value: priceInWei,
  });

  const receipt = await tx.wait();

  // Parse the PurchaseMade event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "PurchaseMade";
    } catch {
      return false;
    }
  });

  let purchaseId = null;
  if (event) {
    const parsed = contract.interface.parseLog(event);
    purchaseId = parsed?.args[0];
  }

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    purchaseId: purchaseId ? Number(purchaseId) : null,
  };
}

export async function getListingFromChain(listingId: number) {
  const provider = getProvider();
  const contract = getMarketplaceContract(provider);

  const listing = await contract.getListing(listingId);

  return {
    listingId: Number(listing[0]),
    workId: Number(listing[1]),
    seller: listing[2],
    listingType: listing[3],
    title: listing[4],
    description: listing[5],
    price: listing[6].toString(),
    isActive: listing[7],
    createdAt: Number(listing[8]),
    soldCount: Number(listing[9]),
  };
}

export async function createConversationOnChain(
  privateKey: string,
  participant2: string,
  listingId: number
) {
  const wallet = getWallet(privateKey);
  const contract = getMessagingContract(wallet);

  const tx = await contract.createConversation(participant2, listingId);
  const receipt = await tx.wait();

  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "ConversationCreated";
    } catch {
      return false;
    }
  });

  let conversationId = null;
  if (event) {
    const parsed = contract.interface.parseLog(event);
    conversationId = parsed?.args[0];
  }

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    conversationId: conversationId ? Number(conversationId) : null,
  };
}

export async function sendMessageOnChain(
  privateKey: string,
  conversationId: number,
  encryptedContent: string,
  encryptedKey: string
) {
  const wallet = getWallet(privateKey);
  const contract = getMessagingContract(wallet);

  const tx = await contract.sendMessage(
    conversationId,
    encryptedContent,
    encryptedKey
  );
  const receipt = await tx.wait();

  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "MessageSent";
    } catch {
      return false;
    }
  });

  let messageId = null;
  if (event) {
    const parsed = contract.interface.parseLog(event);
    messageId = parsed?.args[0];
  }

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    messageId: messageId ? Number(messageId) : null,
  };
}
