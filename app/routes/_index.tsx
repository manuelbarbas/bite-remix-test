import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { ethers } from "ethers";
import { BITE } from "@skalenetwork/bite";

export const meta: MetaFunction = () => {
  return [
    { title: "BITE Mint Token DApp (Remix)" },
    { name: "description", content: "FAIR ERC-20 Token Minting with Remix!" },
  ];
};

// MyToken ABI - Feel free to expand it as necessary
const MyTokenABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export default function Index() {
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");

  // Configuration
  const CONTRACT_ADDRESS = "0x437F581d7C3472a089AAd0D1b53cef5DC72C7d6E";
  const RECIPIENT_ADDRESS = "0xcE7E58D645655CB7B573Fa3B161F344e210Dd2c8";
  const AMOUNT = "1";
  const FAIR_RPC_URL =
    "https://testnet-v1.skalenodes.com/v1/idealistic-dual-miram";

  // Add your private key here (make sure to keep it secure!)
  const PRIVATE_KEY =
    ""; // Replace with your actual private key

  const handleMint = async () => {
    if (!PRIVATE_KEY || PRIVATE_KEY === "") {
      setStatus("Please add your private key to the PRIVATE_KEY variable");
      return;
    }

    setLoading(true);
    setStatus("Preparing mint transaction...");
    setTxHash("");

    try {
      // Create provider and wallet
      const provider = new ethers.JsonRpcProvider(FAIR_RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

      console.log("Minting with account:", wallet.address);
      setStatus(`Minting with account: ${wallet.address}`);

      // Create contract instance
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        MyTokenABI,
        wallet
      );

      // Encode the function data
      const data = contract.interface.encodeFunctionData("mint", [
        RECIPIENT_ADDRESS,
        ethers.parseUnits(AMOUNT, 18),
      ]);

      // Initialize BITE
      const bite = new BITE(FAIR_RPC_URL);

      // Create transaction object
      const transaction = {
        to: CONTRACT_ADDRESS,
        data: data,
      };

      setStatus("Encrypting transaction with BITE...");

      // Encrypt the transaction using BITE
      const encryptedTx = await bite.encryptTransaction(transaction);

      console.log("Encrypted transaction:", encryptedTx);

      setStatus("Sending encrypted transaction...");

      // Send the encrypted transaction
      const tx = await wallet.sendTransaction({
        ...encryptedTx,
        value: 0,
        gasLimit: 100000,
      });

      setStatus(`Transaction sent! Hash: ${tx.hash}`);
      setTxHash(tx.hash);

      console.log("Transaction hash:", tx.hash);

      // Wait for transaction to be mined
      setStatus("Waiting for transaction to be mined...");
      const receipt = await tx.wait();

      console.log("Transaction receipt:", receipt);
      setStatus(
        `✅ Mint successful! Transaction mined in block ${receipt?.blockNumber}`
      );
    } catch (error) {
      console.error("Mint failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          BITE Mint Token DApp (Remix)
        </h1>

        <div className="mb-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-black">Configuration:</h3>
          <div className="space-y-2 text-sm text-black">
            <p>
              <strong>Contract:</strong>{" "}
              <code className="bg-gray-200 px-2 py-1 rounded text-black">
                {CONTRACT_ADDRESS}
              </code>
            </p>
            <p>
              <strong>Recipient:</strong>{" "}
              <code className="bg-gray-200 px-2 py-1 rounded text-black">
                {RECIPIENT_ADDRESS}
              </code>
            </p>
            <p>
              <strong>Amount:</strong>{" "}
              <code className="bg-gray-200 px-2 py-1 rounded text-black">{AMOUNT}</code>
            </p>
            <p>
              <strong>Network:</strong>{" "}
              <span className="text-black">FAIR Testnet</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleMint}
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 cursor-pointer"
          }`}
        >
          {loading ? "Minting..." : "Mint ERC-20 Token"}
        </button>

        {status && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold mb-2">Status:</h4>
            <p className="text-sm break-all">{status}</p>
          </div>
        )}

        {txHash && (
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <h4 className="font-semibold mb-2">Transaction Hash:</h4>
            <p>
              <a
                href={`https://idealistic-dual-miram.explorer.testnet-v1.skalenodes.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1a0dab", textDecoration: "underline" }}
              >
                {txHash}
              </a>
            </p>{" "}
          </div>
        )}
      </div>
    </div>
  );
}
