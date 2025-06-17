import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ConditionalToken contract...");

  const ConditionalToken = await ethers.getContractFactory("ConditionalToken");
  const conditionalToken = await ConditionalToken.deploy();

  await conditionalToken.waitForDeployment();

  const address = await conditionalToken.getAddress();
  console.log(`ConditionalToken deployed to: ${address}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployed by: ${deployer.address}`);
  
  console.log("\nSetting up example verses...");
  
  const ROOT_VERSE = ethers.ZeroHash;
  const POWELL_FIRED = ethers.keccak256(ethers.toUtf8Bytes("powell_fired"));
  const POWELL_NOT_FIRED = ethers.keccak256(ethers.toUtf8Bytes("powell_not_fired"));
  
  await conditionalToken.createVerse(POWELL_FIRED, ROOT_VERSE);
  await conditionalToken.createVerse(POWELL_NOT_FIRED, ROOT_VERSE);
  await conditionalToken.createPartition(ROOT_VERSE, [POWELL_FIRED, POWELL_NOT_FIRED]);
  
  console.log("✅ Created Powell Fed Chair verses and partition");
  
  const amount = ethers.parseEther("1000");
  await conditionalToken.mintToken(deployer.address, ROOT_VERSE, amount);
  
  console.log(`✅ Minted ${ethers.formatEther(amount)} tokens in root verse`);
  
  console.log("\nDeployment complete!");
  console.log(`Contract Address: ${address}`);
  console.log(`Powell Fired Verse ID: ${POWELL_FIRED}`);
  console.log(`Powell Not Fired Verse ID: ${POWELL_NOT_FIRED}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 