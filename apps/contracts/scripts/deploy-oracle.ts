import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Event Resolution system...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy ConditionalToken first
  console.log("Deploying ConditionalToken...");
  const ConditionalTokenFactory = await ethers.getContractFactory("ConditionalToken");
  const conditionalToken = await ConditionalTokenFactory.deploy();
  await conditionalToken.waitForDeployment();
  console.log("ConditionalToken deployed to:", await conditionalToken.getAddress());

  // Deploy OracleManager
  console.log("Deploying OracleManager...");
  const OracleManagerFactory = await ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManagerFactory.deploy(await conditionalToken.getAddress());
  await oracleManager.waitForDeployment();
  console.log("OracleManager deployed to:", await oracleManager.getAddress());

  console.log("\n=== Deployment Summary ===");
  console.log("ConditionalToken:", await conditionalToken.getAddress());
  console.log("OracleManager:", await oracleManager.getAddress());
  console.log("\nEvent resolution system ready for use!");
  console.log("Oracles can now be authorized to resolve real-world events.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 