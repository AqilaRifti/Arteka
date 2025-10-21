// server/api/messaging/send.post.ts
import { createClient } from "@supabase/supabase-js";
import { readBody, createError, H3Event } from "h3";
import { ethers } from "ethers";
import crypto from "crypto";

const MESSAGING_CONTRACT_ADDRESS =
  process.env.MESSAGING_CONTRACT_ADDRESS ??
  "0xc67002474b9328aB96918190e1b79D7ed8d0B3a8";

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const NODE_ENV = process.env.NODE_ENV ?? "development";

type ErrorPayload = {
  code: string;
  message: string;
  details?: any;
};

const MESSAGING_ABI = [
  // keep function signature matching your contract
  "function sendMessage(uint256 _conversationId, string _encryptedContent, string _encryptedKey) public returns (uint256)",
  // event for parsing
  "event MessageSent(uint256 indexed messageId, uint256 indexed conversationId, address indexed sender)",
];

// --- Helpers ---
function makeErrorAndThrow(statusCode: number, payload: ErrorPayload) {
  console.error(`[messaging/send] error`, {
    code: payload.code,
    message: payload.message,
    details: payload.details,
    ts: new Date().toISOString(),
  });
  throw createError({
    statusCode,
    statusMessage: `${payload.code}: ${payload.message}`,
  });
}

function missingEnvVars() {
  const missing: string[] = [];
  if (!SEPOLIA_RPC) missing.push("SEPOLIA_RPC_URL");
  if (!PRIVATE_KEY) missing.push("DEPLOYER_PRIVATE_KEY");
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_KEY");
  return missing;
}

function encryptMessage(message: string, key: Buffer) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");
    return { encrypted, iv: iv.toString("hex") };
  } catch (err: any) {
    throw { code: "ENCRYPTION_ERROR", error: err?.message ?? String(err) };
  }
}

function encryptKey(symmetricKey: Buffer /*, recipientPublicKey?: string */) {
  try {
    // Placeholder: in production use ECIES or other asymmetric encryption to protect the symmetric key
    return symmetricKey.toString("hex");
  } catch (err: any) {
    throw { code: "ENCRYPT_KEY_ERROR", error: err?.message ?? String(err) };
  }
}

/**
 * Normalize conversationId into a BigNumberish accepted by a uint256 param:
 * - number -> bigint
 * - decimal numeric-string -> bigint
 * - hex string (0x...) -> bigint
 * - slug/string -> keccak256(utf8(slug)) -> bigint  (only if contract uses same derivation)
 */
function normalizeConversationIdForUint(conversationId: unknown) {
  // Accept numbers
  if (typeof conversationId === "number") return BigInt(conversationId);

  if (typeof conversationId === "bigint") return conversationId;

  if (typeof conversationId === "string") {
    const trimmed = conversationId.trim();
    // decimal numeric string
    if (/^\d+$/.test(trimmed)) {
      return BigInt(trimmed);
    }
    // hex string
    if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
      return BigInt(trimmed);
    }
    // non-numeric slug -> convert via keccak256(utf8(slug))
    // NOTE: only safe if the contract uses same keccak256(slug) as the lookup key.
    try {
      const hashed = ethers.keccak256(ethers.toUtf8Bytes(trimmed)); // returns 0x...
      return BigInt(hashed);
    } catch (err: any) {
      throw {
        code: "CONV_ID_CONVERSION_ERROR",
        message: "Failed to keccak256-convert conversationId slug",
        error: err?.message ?? String(err),
      };
    }
  }

  // unsupported type
  throw {
    code: "VALIDATION_ERROR",
    message:
      "conversationId must be a number, numeric string, hex string, or slug string",
    receivedType: typeof conversationId,
  };
}

// --- Main Handler ---
export default defineEventHandler(async (event: H3Event) => {
  // --- AUTH: support event.context.auth() pattern with dynamic fallback to getAuth ---
  let userId: string | undefined;
  try {
    const maybeAuthFn = (event as any).context?.auth;
    if (typeof maybeAuthFn === "function") {
      const auth = await maybeAuthFn();
      userId = auth?.userId;
    } else {
      try {
        // dynamic import to avoid bundler/time-of-build issues if Clerk is not available in environment
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getAuth } = await import("@clerk/nuxt/server");
        const auth = getAuth ? getAuth(event) : null;
        userId = auth?.userId;
      } catch {
        userId = undefined;
      }
    }
  } catch (err: any) {
    makeErrorAndThrow(401, {
      code: "AUTH_ERROR",
      message: "Failed to verify user authentication.",
      details: { error: err?.message ?? String(err) },
    });
  }

  if (!userId) {
    makeErrorAndThrow(401, {
      code: "AUTH_ERROR",
      message: "Unauthorized - no user ID",
    });
  }

  // --- BODY validation ---
  const body = await readBody(event);
  const { conversationId, message } = body ?? {};

  if (conversationId === undefined || conversationId === null) {
    makeErrorAndThrow(400, {
      code: "VALIDATION_ERROR",
      message: "conversationId is required",
      details: { received: conversationId },
    });
  }

  if (!message || typeof message !== "string") {
    makeErrorAndThrow(400, {
      code: "VALIDATION_ERROR",
      message: "message is required and must be a string",
      details: { received: message },
    });
  }

  // --- ENV check ---
  const missing = missingEnvVars();
  if (missing.length > 0) {
    makeErrorAndThrow(500, {
      code: "ENV_ERROR",
      message: "Server configuration incomplete",
      details: { missing },
    });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  // --- Encryption ---
  let symmetricKey: Buffer;
  let encryptedContent: string;
  let encryptedKey: string;
  try {
    symmetricKey = crypto.randomBytes(32);
    const { encrypted, iv } = encryptMessage(message, symmetricKey);
    encryptedKey = encryptKey(symmetricKey);
    encryptedContent = `${iv}:${encrypted}`;
  } catch (err: any) {
    const details = err?.error ? err : err?.message ?? String(err);
    makeErrorAndThrow(500, {
      code: "ENCRYPTION_ERROR",
      message: "Failed to encrypt message or symmetric key",
      details,
    });
  }

  // --- Normalize conversationId to BigNumberish for uint256 param ---
  let conversationIdParam: bigint;
  try {
    conversationIdParam = normalizeConversationIdForUint(conversationId);
  } catch (err: any) {
    // err may be structured
    makeErrorAndThrow(400, {
      code: err?.code ?? "VALIDATION_ERROR",
      message: err?.message ?? "Invalid conversationId",
      details: err,
    });
  }

  // --- Blockchain interaction ---
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC!);
  const signer = new ethers.Wallet(PRIVATE_KEY!, provider);
  const contract = new ethers.Contract(
    MESSAGING_CONTRACT_ADDRESS,
    MESSAGING_ABI,
    signer
  );

  let tx: any;
  try {
    // transaction broadcast
    tx = await contract.sendMessage(
      conversationIdParam,
      encryptedContent,
      encryptedKey
    );
  } catch (err: any) {
    makeErrorAndThrow(502, {
      code: "BLOCKCHAIN_TX_FAILED",
      message: "Failed to broadcast transaction to blockchain",
      details: { error: err?.message ?? String(err) },
    });
  }

  let receipt: any;
  try {
    receipt = await tx.wait();
  } catch (err: any) {
    makeErrorAndThrow(502, {
      code: "BLOCKCHAIN_RECEIPT_ERROR",
      message: "Failed while waiting for transaction receipt",
      details: { txHash: tx?.hash ?? null, error: err?.message ?? String(err) },
    });
  }

  // check on-chain status (ethers v6: status === 1 success)
  if (receipt?.status !== undefined && receipt.status !== 1) {
    makeErrorAndThrow(500, {
      code: "BLOCKCHAIN_TX_REVERTED",
      message: "Transaction reverted or failed on-chain",
      details: {
        txHash: receipt.transactionHash ?? receipt.hash,
        status: receipt.status,
        blockNumber: receipt.blockNumber,
      },
    });
  }

  // --- Parse logs for MessageSent ---
  let messageId: string | null = null;
  try {
    if (Array.isArray(receipt.logs)) {
      for (const l of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: l.topics,
            data: l.data,
          });
          if (parsed?.name === "MessageSent") {
            const id = parsed.args?.messageId ?? parsed.args?.[0];
            if (id !== undefined && id !== null) {
              messageId = id.toString();
              break;
            }
          }
        } catch {
          // ignore unrelated logs
        }
      }
    }
  } catch (err: any) {
    // Non-fatal: warn and continue, we still persist the message
    console.warn("[messaging/send] warn: failed to parse logs", {
      err: err?.message ?? String(err),
      txHash: receipt.transactionHash ?? receipt.hash,
    });
  }

  // --- Persist to Supabase ---
  const insertPayload = {
    message_id: messageId,
    conversation_id: conversationId,
    sender_clerk_id: userId,
    encrypted_content: encryptedContent,
    encrypted_key: encryptedKey,
    transaction_hash: receipt.transactionHash ?? receipt.hash,
    block_number: receipt.blockNumber ?? null,
    is_unlocked: false,
  };

  let inserted: any = null;
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert(insertPayload)
      .select()
      .single();
    if (error) {
      // redact encrypted_key in logs/details
      makeErrorAndThrow(502, {
        code: "DB_INSERT_FAILED",
        message: "Failed to insert message record into database",
        details: {
          supabaseError: error,
          insertPayload: { ...insertPayload, encrypted_key: "<redacted>" },
        },
      });
    }
    inserted = data;
  } catch (err: any) {
    makeErrorAndThrow(500, {
      code: "DB_UNKNOWN_ERROR",
      message: "Unexpected error while saving message to database",
      details: { error: err?.message ?? String(err) },
    });
  }

  // --- Response: decryption key only in non-production environments ---
  const decryptionKey =
    NODE_ENV === "production" ? undefined : symmetricKey.toString("hex");

  return {
    success: true,
    messageId,
    transactionHash: receipt.transactionHash ?? receipt.hash,
    blockNumber: receipt.blockNumber ?? null,
    ...(decryptionKey ? { decryptionKey } : { decryptionKey: undefined }),
    message: inserted,
  };
});
