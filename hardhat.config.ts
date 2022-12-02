import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("hardhat-contract-sizer"); // "npx hardhat size-contracts" or "yarn run hardhat size-contracts"

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts:
          process.env.GOERLI_PRIVATE_KEY !== undefined ? [process.env.GOERLI_PRIVATE_KEY] : [],
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
