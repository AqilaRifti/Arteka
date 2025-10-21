// composables/useWeb3.ts
import { ethers } from "ethers";

export const useWeb3 = () => {
  const wallet = ref<string | null>(null);
  const provider = ref<any>(null);
  const signer = ref<any>(null);
  const isConnected = ref(false);

  const MARKETPLACE_ABI = [
    "function purchaseListing(uint256 _listingId) public payable returns (uint256)",
    "function getListing(uint256 _listingId) public view returns (uint256 listingId, uint256 workId, address seller, string memory listingType, string memory title, string memory description, uint256 price, bool isActive, uint256 createdAt, uint256 soldCount)",
  ];

  const connect = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        provider.value = new ethers.BrowserProvider(window.ethereum);
        signer.value = await provider.value.getSigner();
        wallet.value = await signer.value.getAddress();
        isConnected.value = true;

        // Switch to Sepolia if not already
        const network = await provider.value.getNetwork();
        if (network.chainId !== 11155111n) {
          await switchToSepolia();
        }

        return wallet.value;
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        throw error;
      }
    } else {
      throw new Error("MetaMask is not installed");
    }
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia chainId
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Test Network",
              nativeCurrency: {
                name: "Sepolia ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://sepolia.infura.io/v3/"],
              blockExplorerUrls: ["https://sepolia.etherscan.io/"],
            },
          ],
        });
      }
    }
  };

  const purchaseListing = async (listingId: number, priceWei: string) => {
    if (!signer.value) {
      throw new Error("Wallet not connected");
    }

    const config = useRuntimeConfig();
    const contract = new ethers.Contract(
      config.public.marketplaceContractAddress,
      MARKETPLACE_ABI,
      signer.value
    );

    const tx = await contract.purchaseListing(listingId, {
      value: priceWei,
    });

    const receipt = await tx.wait();
    return receipt.hash;
  };

  const getBalance = async () => {
    if (!provider.value || !wallet.value) return "0";
    const balance = await provider.value.getBalance(wallet.value);
    return ethers.formatEther(balance);
  };

  onMounted(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          wallet.value = null;
          isConnected.value = false;
        } else {
          wallet.value = accounts[0];
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  });

  return {
    wallet,
    isConnected,
    connect,
    purchaseListing,
    getBalance,
  };
};
