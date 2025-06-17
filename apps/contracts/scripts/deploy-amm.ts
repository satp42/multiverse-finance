import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Multiverse Finance contracts...");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Deploy ConditionalToken
  const ConditionalTokenFactory = await ethers.getContractFactory("ConditionalToken");
  const conditionalToken = await ConditionalTokenFactory.deploy();
  await conditionalToken.waitForDeployment();
  
  const conditionalTokenAddress = await conditionalToken.getAddress();
  console.log(`ConditionalToken deployed to: ${conditionalTokenAddress}`);

  // Deploy MultiverseAMM
  const MultiverseAMMFactory = await ethers.getContractFactory("MultiverseAMM");
  const amm = await MultiverseAMMFactory.deploy(conditionalTokenAddress);
  await amm.waitForDeployment();
  
  console.log(`MultiverseAMM deployed to: ${await amm.getAddress()}`);
  
  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 