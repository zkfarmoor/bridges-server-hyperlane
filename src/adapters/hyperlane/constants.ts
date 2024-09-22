// src/adapters/hyperlane/constants.ts

export const chainConfig = {
    arbitrum: { id: 42161, name: "Arbitrum" },
    bsc: { id: 56, name: "BSC" },
    ethereum: { id: 1, name: "Ethereum" },
    optimism: { id: 10, name: "Optimism" },
    base: { id: 8453, name: "Base" },
    linea: { id: 59144, name: "Linea" },
};

export const mailboxAddresses: { [chain: string]: string } = {
    arbitrum: "0x979Ca5202784112f4738403dBec5D0F3B9daabB9",
    bsc: "0x2971b9Aec44bE4eb673DF1B88cDB57b96eefe8a4",
    ethereum: "0x2f9DB5616fa3fAd1aB06cB2C906830BA63d135e3",
    optimism: "0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D",
    base: "0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D",
    linea: "0x3C5154a193D6e2955650f9305c8d80c18C814A68",
};

// Add all warp routes from the registry
export const warpRoutes = {
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

export const supportedTokens = Object.keys(warpRoutes);