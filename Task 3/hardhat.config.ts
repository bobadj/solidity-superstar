import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-sepolia.g.alchemy.com/v2/Ual0QiIraUOtLgpCMkIze1kQn6djEvGi",
        blockNumber: 4120501
      }
    }
  }
};

export default config;
