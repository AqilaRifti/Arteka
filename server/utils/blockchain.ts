// server/utils/blockchain.ts
import { ethers } from "ethers";

const DIGITAL_RIGHTS_ABI = [
  "function registerWork(string memory _title, string memory _description, string memory _workType, string memory _ipfsHash, string memory _metadataHash, string memory _fileName, uint256 _fileSize, string memory _mimeType, string memory _originalLanguage) public returns (uint256)",
  "function getWork(uint256 workId) public view returns (uint256 id, address creator, string memory title, string memory description, string memory workType, string memory ipfsHash, string memory metadataHash, uint256 timestamp, bool isActive)",
  "function workCounter() public view returns (uint256)",
];

const MARKETPLACE_ABI = [
  "function createListing(uint256 _workId, string memory _listingType, string memory _title, string memory _description, uint256 _price) public returns (uint256)",
  "function purchaseListing(uint256 _listingId) public payable returns (uint256)",
  "function getListing(uint256 _listingId) public view returns (uint256 listingId, uint256 workId, address seller, string memory listingType, string memory title, string memory description, uint256 price, bool isActive, uint256 createdAt, uint256 soldCount)",
  "function listingCounter() public view returns (uint256)",
];

const MESSAGING_ABI = [
  "function createConversation(address _participant2, uint256 _listingId) public returns (uint256)",
  "function sendMessage(uint256 _conversationId, string memory _encryptedContent, string memory _encryptedKey) public returns (uint256)",
  "function unlockMessageForEvidence(uint256 _messageId, string memory _decryptionKey) public",
  "function getConversationMessages(uint256 _conversationId) public view returns (uint256[] memory)",
  "function getMessage(uint256 _messageId) public view returns (uint256 messageId, uint256 conversationId, address sender, string memory encryptedContent, string memory encryptedKey, uint256 timestamp, bool isUnlocked)",
  "function findConversation(address _participant) public view returns (uint256)",
];

export function getProvider() {
  const config = useRuntimeConfig();
  return new ethers.JsonRpcProvider(config.SEPOLIA_RPC_URL);
}

export function getWallet() {
  const config = useRuntimeConfig();
  const provider = getProvider();
  return new ethers.Wallet(config.PRIVATE_KEY, provider);
}

export function getDigitalRightsContract() {
  const config = useRuntimeConfig();
  const wallet = getWallet();
  return new ethers.Contract(
    config.ARTEKA_CONTRACT_ADDRESS,
    DIGITAL_RIGHTS_ABI,
    wallet
  );
}

export function getMarketplaceContract() {
  const config = useRuntimeConfig();
  const wallet = getWallet();
  return new ethers.Contract(
    config.MARKETPLACE_CONTRACT_ADDRESS,
    MARKETPLACE_ABI,
    wallet
  );
}

export function getMessagingContract() {
  const config = useRuntimeConfig();
  const wallet = getWallet();
  return new ethers.Contract(
    config.MESSAGING_CONTRACT_ADDRESS,
    MESSAGING_ABI,
    wallet
  );
}
