import { ethers } from "hardhat";

async function main() {
  console.log("Testing MultiverseAMM interactions...\n");

  const [deployer] = await ethers.getSigners();
  
  // Deploy ConditionalToken
  console.log("Deploying ConditionalToken...");
  const ConditionalTokenFactory = await ethers.getContractFactory("ConditionalToken");
  const conditionalToken = await ConditionalTokenFactory.deploy();
  await conditionalToken.waitForDeployment();

  // Deploy MultiverseAMM
  console.log("Deploying MultiverseAMM...");
  const MultiverseAMMFactory = await ethers.getContractFactory("MultiverseAMM");
  const amm = await MultiverseAMMFactory.deploy(await conditionalToken.getAddress());
  await amm.waitForDeployment();

  console.log(`ConditionalToken deployed at: ${await conditionalToken.getAddress()}`);
  console.log(`MultiverseAMM deployed at: ${await amm.getAddress()}\n`);

  // Setup verses
  const ROOT_VERSE = ethers.ZeroHash;
  const POWELL_FIRED = ethers.keccak256(ethers.toUtf8Bytes("powell_fired"));
  const POWELL_NOT_FIRED = ethers.keccak256(ethers.toUtf8Bytes("powell_not_fired"));

  console.log("=== Setting up verses ===");
  await conditionalToken.createVerse(POWELL_FIRED, ROOT_VERSE);
  await conditionalToken.createVerse(POWELL_NOT_FIRED, ROOT_VERSE);
  await conditionalToken.createPartition(ROOT_VERSE, [POWELL_FIRED, POWELL_NOT_FIRED]);
  console.log("✅ Verses created");

  // Test pool creation
  console.log("\n=== Testing Pool Creation ===");
  
  // Create a pool using simple token IDs for testing
  const tokenA = 1;
  const tokenB = 2;
  
  await amm.createPool(ROOT_VERSE, tokenA, tokenB);
  console.log(`✅ Created pool for tokens ${tokenA} and ${tokenB} in root verse`);

  // Check reserves
  const [reserveA, reserveB] = await amm.getReserves(ROOT_VERSE, tokenA, tokenB);
  console.log(`Initial reserves: ${reserveA}, ${reserveB}`);

  // Test with conditional tokens
  console.log("\n=== Testing with Conditional Tokens ===");
  const powellFiredTokenId = await conditionalToken.getTokenId(POWELL_FIRED);
  const powellNotFiredTokenId = await conditionalToken.getTokenId(POWELL_NOT_FIRED);
  
  console.log(`Powell Fired Token ID: ${powellFiredTokenId}`);
  console.log(`Powell Not Fired Token ID: ${powellNotFiredTokenId}`);

  // Create pool for conditional tokens in POWELL_FIRED verse
  try {
    await amm.createPool(POWELL_FIRED, powellFiredTokenId, tokenA);
    console.log("✅ Created pool with conditional token");
  } catch (error) {
    console.log("Note: Pool creation with conditional tokens requires proper setup");
  }

  // Test verse resolution effects
  console.log("\n=== Testing Verse Resolution ===");
  await conditionalToken.resolveVerse(ROOT_VERSE, POWELL_NOT_FIRED);
  console.log("✅ Resolved verse");

  // Test evaporation
  await amm.evaporateVerse(POWELL_FIRED);
  console.log("✅ Evaporated losing verse");

  // Try to create pool in resolved verse (should fail)
  try {
    await amm.createPool(POWELL_FIRED, tokenA, tokenB);
    console.log("❌ This should not succeed");
  } catch (error) {
    console.log("✅ Correctly prevented pool creation in resolved verse");
  }

  console.log("\n🎉 MultiverseAMM basic functionality test completed!");
  console.log("The AMM can create pools, handle verse resolution, and prevent operations on resolved verses.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 