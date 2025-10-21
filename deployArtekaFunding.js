import fs from "fs";
import path from "path";
import solc from "solc";
import dotenv from "dotenv";
import { ethers } from "ethers";
import fse from "fs-extra";

dotenv.config();

const CONTRACT_FILE = "ArtekaFunding.sol";
const CONTRACT_NAME = "ArtekaFunding"; // contract name inside the file (exact)
const OUT_FILE = "arteka-funding.json";

function findImports(importPath) {
  // try local project first, then node_modules
  const candidatePaths = [
    path.join(process.cwd(), importPath),
    path.join(process.cwd(), "node_modules", importPath)
  ];

  for (const p of candidatePaths) {
    try {
      const contents = fs.readFileSync(p, "utf8");
      return { contents };
    } catch (err) {
      // continue
    }
  }

  return { error: `Import not found: ${importPath}` };
}
function compileContract() {
  const contractPath = path.join(process.cwd(), CONTRACT_FILE);
  if (!fs.existsSync(contractPath)) {
    throw new Error(`Contract file not found: ${contractPath}`);
  }

  const source = fs.readFileSync(contractPath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      [CONTRACT_FILE]: {
        content: source,
      },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // enable IR pipeline to avoid "stack too deep" in many cases
      viaIR: true,
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === "error");
    const warnings = output.errors.filter(e => e.severity === "warning");
    warnings.forEach(w => console.warn("Warning:", w.formattedMessage));
    if (errors.length) {
      errors.forEach(e => console.error("Error:", e.formattedMessage));
      throw new Error("Compilation failed with errors");
    }
  }

  const contractOutput = output.contracts[CONTRACT_FILE][CONTRACT_NAME];
  if (!contractOutput) {
    throw new Error(`Contract ${CONTRACT_NAME} not found in ${CONTRACT_FILE}. Check the contract name and file.`);
  }

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
  const contract = await factory.deploy(); // no constructor args for ArtekaFunding

  console.log("⏳ Transaction sent. Waiting for deployment...");

  await contract.waitForDeployment();

  // robust address retrieval (works across ethers versions)
  const address = (contract.target ?? contract.address) || (await contract.getAddress?.());
  console.log("✅ Contract deployed at:", address);

  // Save artifact for frontend
  const out = {
    address,
    abi,
    contractName: CONTRACT_NAME,
    sourceFile: CONTRACT_FILE,
    network: process.env.RPC_NETWORK || null,
  };
  await fse.outputJson(path.join(process.cwd(), OUT_FILE), out, { spaces: 2 });

  console.log(`Saved ${OUT_FILE} (ABI + address).`);
  console.log("Done.");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
