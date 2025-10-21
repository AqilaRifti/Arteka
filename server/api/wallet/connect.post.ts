// server/api/wallet/connect.post.ts
// Allow users to connect their own wallet
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "@clerk/nuxt/server";
import { ethers } from "ethers";

export default defineEventHandler(async (event) => {
  try {
    console.log("=== CONNECT WALLET ===");

    // 1. Authenticate
    const { userId } = getAuth(event);
    if (!userId) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    // 2. Parse body
    const body = await readBody(event);
    const { walletAddress, privateKey, walletType } = body;

    console.log("Connect request:", {
      walletAddress,
      hasPrivateKey: !!privateKey,
      walletType,
    });

    // 3. Validate wallet address
    if (!walletAddress) {
      throw createError({
        statusCode: 400,
        message: "Wallet address is required",
      });
    }

    // Check if valid Ethereum address
    if (!ethers.isAddress(walletAddress)) {
      throw createError({
        statusCode: 400,
        message: "Invalid Ethereum address format",
      });
    }

    const normalizedAddress = ethers.getAddress(walletAddress); // Checksum format

    // 4. If private key provided, validate it matches the address
    let validatedPrivateKey = null;
    if (privateKey) {
      try {
        // Remove '0x' prefix if present
        const cleanKey = privateKey.startsWith("0x")
          ? privateKey
          : "0x" + privateKey;

        // Validate private key format
        if (!/^0x[0-9a-fA-F]{64}$/.test(cleanKey)) {
          throw new Error("Invalid private key format");
        }

        // Create wallet from private key
        const wallet = new ethers.Wallet(cleanKey);

        // Verify it matches the provided address
        if (wallet.address.toLowerCase() !== normalizedAddress.toLowerCase()) {
          throw createError({
            statusCode: 400,
            message: "Private key does not match the provided address",
          });
        }

        validatedPrivateKey = cleanKey;
        console.log("Private key validated and matches address");
      } catch (error: any) {
        throw createError({
          statusCode: 400,
          message: "Invalid private key: " + error.message,
        });
      }
    }

    // 5. Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // 6. Check if user already has a wallet
    const { data: existing } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("clerk_user_id", userId)
      .single();

    if (existing) {
      // Update existing wallet
      const { data: updated, error: updateError } = await supabase
        .from("user_wallets")
        .update({
          wallet_address: normalizedAddress,
          encrypted_private_key:
            validatedPrivateKey || existing.encrypted_private_key,
          wallet_type: walletType || "imported",
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_user_id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Update error:", updateError);
        throw createError({
          statusCode: 500,
          message: "Failed to update wallet: " + updateError.message,
        });
      }

      console.log("Wallet updated successfully");

      return {
        success: true,
        wallet: {
          address: updated.wallet_address,
          type: updated.wallet_type,
          hasPrivateKey: !!validatedPrivateKey,
        },
        message: "Wallet updated successfully",
        isNew: false,
      };
    }

    // 7. Create new wallet entry
    const { data: newWallet, error: insertError } = await supabase
      .from("user_wallets")
      .insert({
        clerk_user_id: userId,
        wallet_address: normalizedAddress,
        encrypted_private_key: validatedPrivateKey || "0x" + "0".repeat(64), // Placeholder if no key
        wallet_type: walletType || "imported",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Create error:", insertError);
      throw createError({
        statusCode: 500,
        message: "Failed to save wallet: " + insertError.message,
      });
    }

    console.log("Wallet connected successfully");

    return {
      success: true,
      wallet: {
        address: newWallet.wallet_address,
        type: newWallet.wallet_type,
        hasPrivateKey: !!validatedPrivateKey,
      },
      message: "Wallet connected successfully",
      isNew: true,
    };
  } catch (error: any) {
    console.error("Error connecting wallet:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to connect wallet",
    });
  }
});
