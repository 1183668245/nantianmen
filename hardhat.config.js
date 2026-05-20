import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  networks: {
    bsc: {
      url: process.env.RPC_URL || "https://rpc.ankr.com/bsc/84faef12e33fca8dbfc2e76e72880d034dbd10a5b1d1f3db6633546ece736b71",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY // 用于开源验证
  }
};

export default config;