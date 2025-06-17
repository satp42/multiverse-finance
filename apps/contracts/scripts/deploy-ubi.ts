import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Event-Conditional UBI system...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy ConditionalToken first
  console.log("Deploying ConditionalToken...");
  const ConditionalTokenFactory = await ethers.getContractFactory("ConditionalToken");
  const conditionalToken = await ConditionalTokenFactory.deploy();
  await conditionalToken.waitForDeployment();
  console.log("ConditionalToken deployed to:", await conditionalToken.getAddress());

  // Deploy UBIManager
  console.log("Deploying UBIManager...");
  const UBIManagerFactory = await ethers.getContractFactory("UBIManager");
  const ubiManager = await UBIManagerFactory.deploy(await conditionalToken.getAddress());
  await ubiManager.waitForDeployment();
  console.log("UBIManager deployed to:", await ubiManager.getAddress());

  console.log("\n=== Deployment Summary ===");
  console.log("ConditionalToken:", await conditionalToken.getAddress());
  console.log("UBIManager:", await ubiManager.getAddress());
  console.log("\nEvent-Conditional UBI system ready for use!");
  console.log("Government/organizations can now create UBI programs tied to future events.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 