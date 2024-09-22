import { Chain } from "@defillama/sdk/build/general";
import { BridgeAdapter, PartialContractEventParams } from "../../helpers/bridgeAdapter.type";
import { getTxDataFromEVMEventLogs } from "../../helpers/processTransactions";
import { ethers } from "ethers";

const chainConfig = {
    arbitrum: { id: 42161, name: "Arbitrum" },
    bsc: { id: 56, name: "BSC" },
    ethereum: { id: 1, name: "Ethereum" },
    optimism: { id: 10, name: "Optimism" },
    base: { id: 8453, name: "Base" },
    linea: { id: 59144, name: "Linea" },
};

const mailboxAddresses: { [chain: string]: string } = {
    arbitrum: "0x979Ca5202784112f4738403dBec5D0F3B9daabB9",
    bsc: "0x2971b9Aec44bE4eb673DF1B88cDB57b96eefe8a4",
    ethereum: "0x2f9DB5616fa3fAd1aB06cB2C906830BA63d135e3",
    optimism: "0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D",
    base: "0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D",
    linea: "0x3C5154a193D6e2955650f9305c8d80c18C814A68",
};

const warpRoutes: { [token: string]: { [chain: string]: string } } = {
    USDC: {
        ethereum: "0xe1De9910fe71cC216490AC7FCF019e13a34481D7",
        arbitrum: "0xB26bBfC6d1F469C821Ea25099017862e7368F4E8",
        optimism: "0xacEB607CdF59EB8022Cc0699eEF3eCF246d149e2",
        base: "0x2552516453368e42705D791F674b312b8b87CD9e",
        bsc: "0xE00C6185a5c19219F1FFeD213b4406a254968c26",
    },
    EZETH: {
        arbitrum: "0xB26bBfC6d1F469C821Ea25099017862e7368F4E8",
        base: "0x2552516453368e42705D791F674b312b8b87CD9e",
        bsc: "0xE00C6185a5c19219F1FFeD213b4406a254968c26",
        ethereum: "0xC59336D8edDa9722B4f1Ec104007191Ec16f7087",
        linea: "0xC59336D8edDa9722B4f1Ec104007191Ec16f7087",
        optimism: "0xacEB607CdF59EB8022Cc0699eEF3eCF246d149e2",
    },
};

const supportedTokens = Object.keys(warpRoutes);

const parseHyperlaneMessage = (message: string) => {
  const abiCoder = new ethers.utils.AbiCoder();
  const decoded = abiCoder.decode(["uint256", "bytes"], message);
  const amount = decoded[0];
  const tokenBytes = decoded[1];
  const token = ethers.utils.getAddress("0x" + tokenBytes.slice(24));
  return { token, amount };
};

const mailboxABI = [
  "event Dispatch(uint32 indexed destinationDomain, bytes32 indexed recipientAddress, bytes message)",
  "event Process(uint32 indexed originDomain, bytes32 indexed sender, address indexed recipient)"
];

const warpRouteABI = [
  "event TransferRemote(uint32 indexed destinationDomain, bytes32 indexed recipientAddress, uint256 amount)",
  "event TransferLocal(uint32 indexed originDomain, address indexed recipient, uint256 amount)"
];

const createMailboxParams = (chain: Chain): PartialContractEventParams[] => [
  {
    target: mailboxAddresses[chain],
    topic: "Dispatch(uint32,bytes32,bytes)",
    abi: mailboxABI,
    isDeposit: true,
    logKeys: {
      blockNumber: "blockNumber",
      txHash: "transactionHash",
    },
    argKeys: {
      from: "sender",
      to: "recipientAddress",
      token: "message",
      amount: "message",
    },
    argGetters: {
      token: (log: any) => parseHyperlaneMessage(log.args.message).token,
      amount: (log: any) => parseHyperlaneMessage(log.args.message).amount,
    },
  },
  {
    target: mailboxAddresses[chain],
    topic: "Process(uint32,bytes32,address)",
    abi: mailboxABI,
    isDeposit: false,
    logKeys: {
      blockNumber: "blockNumber",
      txHash: "transactionHash",
    },
    argKeys: {
      from: "sender",
      to: "recipient",
      token: "message",
      amount: "message",
    },
    argGetters: {
      token: (log: any) => parseHyperlaneMessage(log.args.message).token,
      amount: (log: any) => parseHyperlaneMessage(log.args.message).amount,
    },
  }
];

const createWarpRouteParams = (chain: Chain): PartialContractEventParams[] => 
  supportedTokens.flatMap(token => {
    const address = warpRoutes[token][chain as keyof typeof warpRoutes[typeof token]];
    if (!address) return [];
    return [
      {
        target: address,
        topic: "TransferRemote(uint32,bytes32,uint256)",
        abi: warpRouteABI,
        isDeposit: true,
        logKeys: {
          blockNumber: "blockNumber",
          txHash: "transactionHash",
        },
        argKeys: {
          amount: "amount",
          to: "recipientAddress",
        },
        fixedEventData: {
          token: address,
          from: address,
        },
      },
      {
        target: address,
        topic: "TransferLocal(uint32,address,uint256)",
        abi: warpRouteABI,
        isDeposit: false,
        logKeys: {
          blockNumber: "blockNumber",
          txHash: "transactionHash",
        },
        argKeys: {
          amount: "amount",
          to: "recipient",
        },
        fixedEventData: {
          token: address,
          from: address,
        },
      }
    ];
  });

const constructParams = (chain: Chain) => {
  const mailboxParams = createMailboxParams(chain);
  const warpRouteParams = createWarpRouteParams(chain);

  return async (fromBlock: number, toBlock: number) => {
    console.log(`Processing ${chain} from block ${fromBlock} to ${toBlock}`);
    const mailboxTxs = await getTxDataFromEVMEventLogs("hyperlane", chain, fromBlock, toBlock, mailboxParams);
    console.log(`Found ${mailboxTxs.length} mailbox transactions for ${chain}`);
    const warpRouteTxs = await getTxDataFromEVMEventLogs("hyperlane", chain, fromBlock, toBlock, warpRouteParams);
    console.log(`Found ${warpRouteTxs.length} warp route transactions for ${chain}`);
    return [...mailboxTxs, ...warpRouteTxs];
  };
};

const adapter: BridgeAdapter = Object.fromEntries(
  Object.keys(chainConfig).map(chain => [chain, constructParams(chain as Chain)])
);

export default adapter;