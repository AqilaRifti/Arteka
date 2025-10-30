// deploy.js
import fs from "fs";
import path from "path";
import solc from "solc";
import dotenv from "dotenv";
import { ethers } from "ethers";
import fse from "fs-extra";

dotenv.config();

const SOL_FILE = "ArtekaContracts.sol"; // file containing both contracts
const CONTRACT_NAMES = ["ArtekaMarketplace", "ArtekaMessaging"]; // names to deploy

function compileSolidity() {
  const sourcePath = path.join(process.cwd(), SOL_FILE);
  if (!fs.existsSync(sourcePath)) throw new Error(`${SOL_FILE} not found`);
  const source = fs.readFileSync(sourcePath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      [SOL_FILE]: { content: source },
    },
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode"] },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === "error");
    const warnings = output.errors.filter(e => e.severity === "warning");
    warnings.forEach(w => console.warn("solc warning:", w.formattedMessage));
    if (errors.length) {
      errors.forEach(e => console.error("solc error:", e.formattedMessage));
      throw new Error("Compilation failed — see errors above");
    }
  }

  const compiled = output.contracts[SOL_FILE];
  const result = {};
  for (const name of Object.keys(compiled)) {
    result[name] = {
      abi: compiled[name].abi,
      bytecode: compiled[name].evm.bytecode.object,
    };
  }
  return result;
}

function normalizePrivateKey(raw) {
  if (!raw) throw new Error("PRIVATE_KEY is not set in .env");
  const key = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(key)) {
    throw new Error("PRIVATE_KEY must be 0x + 64 hex chars");
  }
  return key;
}

async function main() {
  if (!process.env.RPC_URL) throw new Error("RPC_URL not set in .env");

  console.log("Compiling contracts...");
  const compiled = compileSolidity();

  // ensure required contracts are present
  for (const name of CONTRACT_NAMES) {
    if (!compiled[name]) throw new Error(`Compiled output missing ${name}`);
  }

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const PRIVATE_KEY = normalizePrivateKey(process.env.PRIVATE_KEY);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Deployer address:", await wallet.getAddress());

  const artifactsDir = path.join(process.cwd(), "artifacts");
  await fse.ensureDir(artifactsDir);

  for (const name of CONTRACT_NAMES) {
    console.log(`\n--- Deploying ${name} ---`);
    const { abi, bytecode } = compiled[name];

    if (!bytecode || bytecode.length === 0) {
      throw new Error(`No bytecode for ${name} — check Solidity code & compiler version`);
    }

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(); // add constructor args if needed: factory.deploy(arg1, arg2)
    console.log(`txHash: ${contract.deploymentTransaction()?.hash ?? "unknown"}`);
    console.log("Waiting for deployment to be mined...");
    await contract.waitForDeployment();

    // ethers v6: contract.target OR contract.address depending on environment
    const address = (contract.target ?? contract.address) || (await contract.getAddress?.());
    console.log(`${name} deployed at:`, address);

    const out = { address, abi };
    const outPath = path.join(artifactsDir, `${name.toLowerCase()}.json`);
    await fse.outputJson(outPath, out, { spaces: 2 });
    console.log(`Saved artifact: ${outPath}`);
  }

  console.log("\nAll done. Artifacts written to ./artifacts/*.json");
}

main().catch(err => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
