// server/api/marketplace/create-listing.post.ts
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nuxt/server";
import { ethers } from "ethers";

const MARKETPLACE_CONTRACT_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS!;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL! || "https://sepolia.infura.io/v3/fc854b36bd1044cbb4b7f30a5f9134c3";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY!;

// Simplified ABI - only the function we need
const MARKETPLACE_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_workId", type: "uint256" },
      { internalType: "string", name: "_listingType", type: "string" },
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "uint256", name: "_price", type: "uint256" },
    ],
    name: "createListing",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "listingType",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "ListingCreated",
    type: "event",
  },
];

export default defineEventHandler(async (event) => {
  try {
    // 1. Authenticate user
    const { userId } = getAuth(event);
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized - Please sign in",
      });
    }

    console.log("User authenticated:", userId);

    // 2. Parse request body
    const body = await readBody(event);
    const { workId, title, description, priceInEth, campaignId } = body;

    // 3. Validate inputs
    if (!workId) {
      throw createError({
        statusCode: 400,
        message: "Work ID is required",
      });
    }

    if (!title || title.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: "Title is required",
      });
    }

    if (!priceInEth || priceInEth <= 0) {
      throw createError({
        statusCode: 400,
        message: "Price must be greater than 0",
      });
    }

    console.log("Request validated:", { workId, title, priceInEth });

    // 4. Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // 5. Get user wallet
    const { data: wallet, error: walletError } = await supabase
      .from("user_wallets")
      .select("wallet_address")
      .eq("clerk_user_id", userId)
      .single();

    if (walletError || !wallet) {
      console.error("Wallet error:", walletError);
      throw createError({
        statusCode: 404,
        message: "Wallet not found. Please complete your profile.",
      });
    }

    console.log("Wallet found:", wallet.wallet_address);

    // 6. Verify user owns the work
    const { data: work, error: workError } = await supabase
      .from("digital_works")
      .select("*")
      .eq("work_id", workId)
      .eq("clerk_user_id", userId)
      .single();

    if (workError || !work) {
      console.error("Work error:", workError);
      throw createError({
        statusCode: 404,
        message: "Work not found or you do not own this work",
      });
    }

    console.log("Work verified:", work.title);

    // 7. Connect to blockchain
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Check signer balance
    const balance = await provider.getBalance(signer.address);
    console.log("Signer balance:", ethers.formatEther(balance), "ETH");

    if (balance === 0n) {
      throw createError({
        statusCode: 500,
        message:
          "Insufficient funds in deployer wallet. Please add Sepolia ETH.",
      });
    }

    const contract = new ethers.Contract(
      MARKETPLACE_CONTRACT_ADDRESS,
      MARKETPLACE_ABI,
      signer
    );

    console.log("Connected to contract:", MARKETPLACE_CONTRACT_ADDRESS);

    // 8. Convert price to wei
    const priceInWei = ethers.parseEther(priceInEth.toString());
    console.log("Price in wei:", priceInWei.toString());

    // 9. Create listing on blockchain
    console.log("Creating listing on blockchain...");

    const tx = await contract.createListing(
      workId,
      "product", // listingType
      title,
      description || "",
      priceInWei
    );

    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // 10. Extract listingId from event
    let listingId: string | null = null;

    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });

        if (parsedLog && parsedLog.name === "ListingCreated") {
          listingId = parsedLog.args[0].toString();
          console.log("Listing ID from event:", listingId);
          break;
        }
      } catch (parseError) {
        // Skip logs that don't match our ABI
        continue;
      }
    }

    if (!listingId) {
      console.warn("Could not extract listing ID from events, using counter");
      // Fallback: you might need to query the contract for the latest listing ID
      listingId = Date.now().toString(); // Temporary fallback
    }

    // 11. Store in database
    const { data: listing, error: dbError } = await supabase
      .from("marketplace_listings")
      .insert({
        listing_id: listingId,
        work_id: workId,
        seller_wallet: wallet.wallet_address,
        clerk_user_id: userId,
        listing_type: "product",
        title: title,
        description: description || "",
        price_eth: priceInEth,
        price_wei: priceInWei.toString(),
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
        status: "active",
        // Optional campaign linking
        campaign_id: campaignId || null,
        routes_to_campaign: !!campaignId,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Transaction succeeded on blockchain but failed to store in DB
      // Log this for manual intervention
      throw createError({
        statusCode: 500,
        message: `Listing created on blockchain (${receipt.hash}) but failed to store in database. Contact support.`,
      });
    }

    console.log("Listing stored in database:", listing.id);

    // 12. If linked to campaign, bind the work
    if (campaignId) {
      try {
        console.log("Binding work to campaign:", campaignId);

        await $fetch("/api/funding/campaigns/bind-work", {
          method: "POST",
          body: {
            workId,
            campaignId,
          },
        });

        console.log("Work bound to campaign successfully");
      } catch (bindError) {
        console.error("Failed to bind work to campaign:", bindError);
        // Continue anyway - listing is still created
      }
    }

    // 13. Return success response
    return {
      success: true,
      listingId: listingId,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      listing: listing,
      explorerUrl: `https://sepolia.etherscan.io/tx/${receipt.hash}`,
      message: "Listing created successfully!",
    };
  } catch (error: any) {
    console.error("Error in create-listing:", error);

    // Return detailed error information
    if (error.statusCode) {
      // Already a createError, rethrow it
      throw error;
    }

    // Check for specific blockchain errors
    if (error.code === "INSUFFICIENT_FUNDS") {
      throw createError({
        statusCode: 500,
        message:
          "Insufficient funds for gas. Please add Sepolia ETH to your wallet.",
      });
    }

    if (error.code === "NETWORK_ERROR") {
      throw createError({
        statusCode: 500,
        message: "Network error. Please check your RPC URL and try again.",
      });
    }

    if (error.reason) {
      throw createError({
        statusCode: 500,
        message: `Blockchain error: ${error.reason}`,
      });
    }

    // Generic error
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to create listing. Please try again.",
    });
  }
});
