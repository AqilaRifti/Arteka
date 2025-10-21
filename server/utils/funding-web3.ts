// server/utils/funding-web3.ts
import { ethers } from "ethers";

const FUNDING_ABI = [
  "function createCampaign(string memory _title, string memory _description, string memory _projectType, uint256 _fundingGoal, uint256 _creatorShare, uint256 _durationInDays) public returns (uint256)",
  "function fundCampaign(uint256 _campaignId) public payable",
  "function receiveRevenue(uint256 _campaignId, string memory _source) public payable",
  "function refundCampaign(uint256 _campaignId) public",
  "function getCampaign(uint256 _campaignId) public view returns (uint256 campaignId, address creator, string memory title, string memory description, string memory projectType, uint256 fundingGoal, uint256 totalFunded, uint256 creatorShare, uint256 backersShare, uint256 deadline, bool isActive, bool isFunded, uint256 totalRevenue, uint256 totalDistributed)",
  "function getCampaignBackers(uint256 _campaignId) public view returns (tuple(address backerAddress, uint256 amount, uint256 timestamp, uint256 claimedRevenue)[] memory)",
  "function getCampaignRevenues(uint256 _campaignId) public view returns (tuple(uint256 paymentId, uint256 campaignId, address payer, uint256 amount, string source, uint256 timestamp, bool isDistributed)[] memory)",
  "function getBackerContribution(uint256 _campaignId, address _backer) public view returns (uint256)",
  "event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 fundingGoal, uint256 creatorShare, uint256 deadline, uint256 timestamp)",
  "event CampaignFunded(uint256 indexed campaignId, address indexed backer, uint256 amount, uint256 totalFunded, uint256 timestamp)",
  "event RevenueReceived(uint256 indexed paymentId, uint256 indexed campaignId, address indexed payer, uint256 amount, string source, uint256 timestamp)",
];

export function getFundingContract(
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  const config = useRuntimeConfig();
  return new ethers.Contract(
    "0x3C5Cd01FE8A68D3BE543b1ED4BEfbC1660F43F70",
    FUNDING_ABI,
    signerOrProvider
  );
}

export async function createCampaignOnChain(
  privateKey: string,
  title: string,
  description: string,
  projectType: string,
  fundingGoalInEth: string,
  creatorSharePercent: number, // 0-100
  durationInDays: number
) {
  const wallet = getWallet(privateKey);
  const contract = getFundingContract(wallet);

  const fundingGoalInWei = ethers.parseEther(fundingGoalInEth);
  const creatorShareBasisPoints = creatorSharePercent * 100; // Convert to basis points (5000 = 50%)

  const tx = await contract.createCampaign(
    title,
    description,
    projectType,
    fundingGoalInWei,
    creatorShareBasisPoints,
    durationInDays
  );

  const receipt = await tx.wait();

  // Parse the CampaignCreated event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "CampaignCreated";
    } catch {
      return false;
    }
  });

  let campaignId = null;
  if (event) {
    const parsed = contract.interface.parseLog(event);
    campaignId = parsed?.args[0];
  }

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    campaignId: campaignId ? Number(campaignId) : null,
  };
}

export async function fundCampaignOnChain(
  privateKey: string,
  campaignId: number,
  amountInEth: string
) {
  const wallet = getWallet(privateKey);
  const contract = getFundingContract(wallet);

  const amountInWei = ethers.parseEther(amountInEth);

  const tx = await contract.fundCampaign(campaignId, {
    value: amountInWei,
  });

  const receipt = await tx.wait();

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

export async function sendRevenueToChain(
  privateKey: string,
  campaignId: number,
  amountInEth: string,
  source: string
) {
  const wallet = getWallet(privateKey);
  const contract = getFundingContract(wallet);

  const amountInWei = ethers.parseEther(amountInEth);

  const tx = await contract.receiveRevenue(campaignId, source, {
    value: amountInWei,
  });

  const receipt = await tx.wait();

  // Parse the RevenueReceived event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === "RevenueReceived";
    } catch {
      return false;
    }
  });

  let paymentId = null;
  if (event) {
    const parsed = contract.interface.parseLog(event);
    paymentId = parsed?.args[0];
  }

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    paymentId: paymentId ? Number(paymentId) : null,
  };
}

export async function getCampaignFromChain(campaignId: number) {
  const provider = getProvider();
  const contract = getFundingContract(provider);

  const campaign = await contract.getCampaign(campaignId);

  return {
    campaignId: Number(campaign[0]),
    creator: campaign[1],
    title: campaign[2],
    description: campaign[3],
    projectType: campaign[4],
    fundingGoal: campaign[5].toString(),
    totalFunded: campaign[6].toString(),
    creatorShare: Number(campaign[7]),
    backersShare: Number(campaign[8]),
    deadline: Number(campaign[9]),
    isActive: campaign[10],
    isFunded: campaign[11],
    totalRevenue: campaign[12].toString(),
    totalDistributed: campaign[13].toString(),
  };
}

export async function getCampaignBackersFromChain(campaignId: number) {
  const provider = getProvider();
  const contract = getFundingContract(provider);

  const backers = await contract.getCampaignBackers(campaignId);

  return backers.map((backer: any) => ({
    backerAddress: backer[0],
    amount: backer[1].toString(),
    timestamp: Number(backer[2]),
    claimedRevenue: backer[3].toString(),
  }));
}

export async function getCampaignRevenuesFromChain(campaignId: number) {
  const provider = getProvider();
  const contract = getFundingContract(provider);

  const revenues = await contract.getCampaignRevenues(campaignId);

  return revenues.map((rev: any) => ({
    paymentId: Number(rev[0]),
    campaignId: Number(rev[1]),
    payer: rev[2],
    amount: rev[3].toString(),
    source: rev[4],
    timestamp: Number(rev[5]),
    isDistributed: rev[6],
  }));
}
