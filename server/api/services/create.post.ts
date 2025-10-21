//server/api/services/create.post.ts;
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nuxt/server";
import { ethers } from "ethers";

const MARKETPLACE_CONTRACT_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS!;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL!;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY!;

const MARKETPLACE_ABI = [
  "function createListing(uint256 _workId, string memory _listingType, string memory _title, string memory _description, uint256 _price) public returns (uint256)",
];

export default defineEventHandler(async (event) => {
  const { userId } = getAuth(event);
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const body = await readBody(event);
  const {
    title,
    description,
    category,
    priceInEth,
    deliveryTime,
    revisions,
    portfolio,
    requirements,
  } = body;

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Get user wallet
    const { data: wallet } = await supabase
      .from("user_wallets")
      .select("wallet_address")
      .eq("clerk_user_id", userId)
      .single();

    if (!wallet) throw new Error("Wallet not found");

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      MARKETPLACE_CONTRACT_ADDRESS,
      MARKETPLACE_ABI,
      signer
    );

    // Convert price to wei
    const priceInWei = ethers.parseEther(priceInEth.toString());

    // Create listing on blockchain
    const tx = await contract.createListing(
      0, // No work ID for services
      "service",
      title,
      description,
      priceInWei
    );

    const receipt = await tx.wait();

    // Extract listingId from event
    let listingId;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === "ListingCreated") {
          listingId = parsed.args[0].toString();
          break;
        }
      } catch {}
    }

    // Store in database with service-specific fields
    const { data: service } = await supabase
      .from("service_listings")
      .insert({
        listing_id: listingId,
        seller_wallet: wallet.wallet_address,
        clerk_user_id: userId,
        title,
        description,
        category,
        price_eth: priceInEth,
        price_wei: priceInWei.toString(),
        delivery_time: deliveryTime,
        revisions,
        portfolio: portfolio || [],
        requirements: requirements || [],
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
        status: "active",
      })
      .select()
      .single();

    return {
      success: true,
      listingId,
      transactionHash: receipt.hash,
      service,
    };
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message });
  }
});
