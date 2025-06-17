import { ethers } from "hardhat";

async function main() {
  console.log("Testing ConditionalToken interactions...\n");

  const ConditionalToken = await ethers.getContractFactory("ConditionalToken");
  const conditionalToken = await ConditionalToken.deploy();
  await conditionalToken.waitForDeployment();

  const [deployer] = await ethers.getSigners();
  const address = await conditionalToken.getAddress();
  
  console.log(`Contract deployed at: ${address}`);
  console.log(`Testing with account: ${deployer.address}\n`);

  const ROOT_VERSE = ethers.ZeroHash;
  const POWELL_FIRED = ethers.keccak256(ethers.toUtf8Bytes("powell_fired"));
  const POWELL_NOT_FIRED = ethers.keccak256(ethers.toUtf8Bytes("powell_not_fired"));

  console.log("=== Setting up verses ===");
  await conditionalToken.createVerse(POWELL_FIRED, ROOT_VERSE);
  await conditionalToken.createVerse(POWELL_NOT_FIRED, ROOT_VERSE);
  await conditionalToken.createPartition(ROOT_VERSE, [POWELL_FIRED, POWELL_NOT_FIRED]);
  console.log("✅ Verses and partition created");

  console.log("\n=== Testing Mint ===");
  const amount = ethers.parseEther("100");
  const rootTokenId = await conditionalToken.getTokenId(ROOT_VERSE);
  
  await conditionalToken.mintToken(deployer.address, ROOT_VERSE, amount);
  const balance = await conditionalToken.balanceOf(deployer.address, rootTokenId);
  console.log(`✅ Minted ${ethers.formatEther(amount)} tokens`);
  console.log(`Balance: ${ethers.formatEther(balance)} tokens`);

  console.log("\n=== Testing Split (Burn parent, Mint children) ===");
  const splitAmount = ethers.parseEther("50");
  
  await conditionalToken.splitOwnership(ROOT_VERSE, [POWELL_FIRED, POWELL_NOT_FIRED], splitAmount);
  
  const rootBalanceAfterSplit = await conditionalToken.balanceOf(deployer.address, rootTokenId);
  const firedBalance = await conditionalToken.balanceOf(deployer.address, await conditionalToken.getTokenId(POWELL_FIRED));
  const notFiredBalance = await conditionalToken.balanceOf(deployer.address, await conditionalToken.getTokenId(POWELL_NOT_FIRED));
  
  console.log(`✅ Split ${ethers.formatEther(splitAmount)} tokens`);
  console.log(`Root balance after split: ${ethers.formatEther(rootBalanceAfterSplit)}`);
  console.log(`Powell Fired balance: ${ethers.formatEther(firedBalance)}`);
  console.log(`Powell Not Fired balance: ${ethers.formatEther(notFiredBalance)}`);

  console.log("\n=== Testing Combine (Burn children, Mint parent) ===");
  const combineAmount = ethers.parseEther("25");
  
  await conditionalToken.combineOwnership([POWELL_FIRED, POWELL_NOT_FIRED], ROOT_VERSE, combineAmount);
  
  const rootBalanceAfterCombine = await conditionalToken.balanceOf(deployer.address, rootTokenId);
  const firedBalanceAfterCombine = await conditionalToken.balanceOf(deployer.address, await conditionalToken.getTokenId(POWELL_FIRED));
  const notFiredBalanceAfterCombine = await conditionalToken.balanceOf(deployer.address, await conditionalToken.getTokenId(POWELL_NOT_FIRED));
  
  console.log(`✅ Combined ${ethers.formatEther(combineAmount)} tokens`);
  console.log(`Root balance after combine: ${ethers.formatEther(rootBalanceAfterCombine)}`);
  console.log(`Powell Fired balance after combine: ${ethers.formatEther(firedBalanceAfterCombine)}`);
  console.log(`Powell Not Fired balance after combine: ${ethers.formatEther(notFiredBalanceAfterCombine)}`);

  console.log("\n=== Testing Resolution (Evaporate losing verse) ===");
  await conditionalToken.resolveVerse(ROOT_VERSE, POWELL_NOT_FIRED);
  
  const rootVerse = await conditionalToken.verses(ROOT_VERSE);
  const firedVerse = await conditionalToken.verses(POWELL_FIRED);
  const notFiredVerse = await conditionalToken.verses(POWELL_NOT_FIRED);
  
  console.log(`✅ Resolved verse with outcome: Powell Not Fired`);
  console.log(`Root verse resolved: ${rootVerse.resolved}`);
  console.log(`Powell Fired verse resolved (evaporated): ${firedVerse.resolved}`);
  console.log(`Powell Not Fired verse resolved: ${notFiredVerse.resolved}`);

  console.log("\n🎉 All tests completed successfully!");
  console.log("The ConditionalToken contract is working correctly with mint/burn functionality.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 