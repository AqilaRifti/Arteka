// File: server/api/digital-rights/list.get.ts
import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";

const ARTEKA_CONTRACT_ADDRESS = process.env.ARTEKA_CONTRACT_ADDRESS!;
const SEPOLIA_RPC =
  process.env.SEPOLIA_RPC_URL ||
  "https://sepolia.infura.io/v3/fc854b36bd1044cbb4b7f30a5f9134c3";

const CONTRACT_ABI = [
  "function getAllActiveWorks() public view returns (uint256[] memory)",
  "function getWork(uint256 workId) public view returns (uint256 id, address creator, string memory title, string memory description, string memory workType, string memory ipfsHash, string memory metadataHash, uint256 timestamp, bool isActive)",
];

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const creator = query.creator as string | undefined;

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    let dbQuery = supabase
      .from("digital_works")
      .select("*")
      .order("created_at", { ascending: false });

    if (creator) {
      const { data: walletData } = await supabase
        .from("user_wallets")
        .select("wallet_address")
        .eq("clerk_user_id", creator)
        .single();

      if (walletData) {
        dbQuery = dbQuery.eq("creator_wallet", walletData.wallet_address);
      }
    }

    const { data: works, error } = await dbQuery;

    if (error) throw error;

    return {
      works: works || [],
      count: works?.length || 0,
    };
  } catch (error: any) {
    console.error("Error fetching works:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to fetch works",
    });
  }
});
