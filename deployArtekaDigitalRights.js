import fs from "fs";
import path from "path";
import solc from "solc";
import dotenv from "dotenv";
import { ethers } from "ethers";
import fse from "fs-extra";

dotenv.config();

const CONTRACT_FILE = "ArtekaDigitalRights.sol";
const CONTRACT_NAME = "ArtekaDigitalRights"; // contract name inside the file

function compileContract() {
  const source = fs.readFileSync(path.join(process.cwd(), CONTRACT_FILE), "utf8");

  const input = {
    language: "Solidity",
    sources: {
      [CONTRACT_FILE]: {
        content: source,
      },
    },
    settings: {

      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    // Print warnings + errors
    const errors = output.errors.filter(e => e.severity === "error");
    const warnings = output.errors.filter(e => e.severity === "warning");
    warnings.forEach(w => console.warn("Warning:", w.formattedMessage));
    if (errors.length) {
      errors.forEach(e => console.error("Error:", e.formattedMessage));
      throw new Error("Compilation failed");
    }
  }

  const contractOutput = output.contracts[CONTRACT_FILE][CONTRACT_NAME];
  const abi = contractOutput.abi;
  const bytecode = contractOutput.evm.bytecode.object;

  if (!bytecode || bytecode.length === 0) {
    throw new Error("No bytecode found — check Solidity version and contract name");
  }

  return { abi, bytecode };
}

async function main() {
  if (!process.env.PRIVATE_KEY || !process.env.RPC_URL) {
    throw new Error("Set PRIVATE_KEY and RPC_URL in .env");
  }

  console.log("Compiling contract...");
  const { abi, bytecode } = compileContract();

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying from:", await wallet.getAddress());

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();

  console.log("⏳ Transaction sent. Waiting for deployment...");
  await contract.waitForDeployment();

  // robust address retrieval (works across versions)
  const address = (contract.target ?? contract.address) || (await contract.getAddress?.());
  console.log("✅ Contract deployed at:", address);

  // Save artifact for frontend
  const out = {
    address,
    abi,
  };
  await fse.outputJson(path.join(process.cwd(), "arteka-contract.json"), out, { spaces: 2 });

  console.log("Saved arteka-contract.json (ABI + address).");
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
