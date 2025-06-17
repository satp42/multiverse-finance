import { ethers } from "hardhat";

async function main() {
  console.log("Testing Event Resolution with OracleManager...\n");

  const [deployer, oracle1, oracle2, user1, user2] = await ethers.getSigners();
  
  // Deploy contracts
  console.log("Deploying ConditionalToken...");
  const ConditionalTokenFactory = await ethers.getContractFactory("ConditionalToken");
  const conditionalToken = await ConditionalTokenFactory.deploy();
  await conditionalToken.waitForDeployment();

  console.log("Deploying OracleManager...");
  const OracleManagerFactory = await ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManagerFactory.deploy(await conditionalToken.getAddress());
  await oracleManager.waitForDeployment();

  console.log(`ConditionalToken deployed at: ${await conditionalToken.getAddress()}`);
  console.log(`OracleManager deployed at: ${await oracleManager.getAddress()}\n`);

  // Setup verses and partitions for different events
  const ROOT_VERSE = ethers.ZeroHash;
  const ELECTION_VERSE = ethers.keccak256(ethers.toUtf8Bytes("election_2024"));
  const FED_RATE_VERSE = ethers.keccak256(ethers.toUtf8Bytes("fed_rate_decision"));
  
  const CANDIDATE_A = ethers.keccak256(ethers.toUtf8Bytes("candidate_alice"));
  const CANDIDATE_B = ethers.keccak256(ethers.toUtf8Bytes("candidate_bob"));
  const RATE_HIKE = ethers.keccak256(ethers.toUtf8Bytes("rate_hike"));
  const RATE_HOLD = ethers.keccak256(ethers.toUtf8Bytes("rate_hold"));

  console.log("=== Setting up Event Verses ===");
  
  // Create election verse structure
  await conditionalToken.createVerse(ELECTION_VERSE, ROOT_VERSE);
  await conditionalToken.createVerse(CANDIDATE_A, ELECTION_VERSE);
  await conditionalToken.createVerse(CANDIDATE_B, ELECTION_VERSE);
  await conditionalToken.createPartition(ELECTION_VERSE, [CANDIDATE_A, CANDIDATE_B]);
  console.log("✅ Created election verses: Alice vs Bob");

  // Create Fed rate decision verse structure
  await conditionalToken.createVerse(FED_RATE_VERSE, ROOT_VERSE);
  await conditionalToken.createVerse(RATE_HIKE, FED_RATE_VERSE);
  await conditionalToken.createVerse(RATE_HOLD, FED_RATE_VERSE);
  await conditionalToken.createPartition(FED_RATE_VERSE, [RATE_HIKE, RATE_HOLD]);
  console.log("✅ Created Fed rate verses: Hike vs Hold");

  // Transfer ConditionalToken ownership to OracleManager for resolution authority
  await conditionalToken.transferOwnership(await oracleManager.getAddress());

  // Setup oracles
  console.log("\n=== Setting up Oracles ===");
  await oracleManager.setOracleAuthorization(oracle1.address, true);
  await oracleManager.setOracleAuthorization(oracle2.address, true);
  console.log(`✅ Authorized oracle1: ${oracle1.address}`);
  console.log(`✅ Authorized oracle2: ${oracle2.address}`);

  // Register events with their responsible oracles
  console.log("\n=== Registering Events ===");
  await oracleManager.registerEvent(ELECTION_VERSE, oracle1.address);
  await oracleManager.registerEvent(FED_RATE_VERSE, oracle2.address);
  console.log("✅ Registered election event with oracle1");
  console.log("✅ Registered Fed rate event with oracle2");

  // Check event status before resolution
  console.log("\n=== Pre-Resolution Event Status ===");
  const [electionOracle, electionResolved, electionOutcome] = await oracleManager.getEventStatus(ELECTION_VERSE);
  const [rateOracle, rateResolved, rateOutcome] = await oracleManager.getEventStatus(FED_RATE_VERSE);
  
  console.log(`Election Event - Oracle: ${electionOracle}, Resolved: ${electionResolved}`);
  console.log(`Fed Rate Event - Oracle: ${rateOracle}, Resolved: ${rateResolved}`);

  // Demonstrate event resolution by different oracles
  console.log("\n=== Resolving Events ===");
  
  // Oracle1 resolves election: Alice wins
  console.log("🗳️  Oracle1 reporting: Alice wins the election!");
  await oracleManager.connect(oracle1).submitOutcome(ELECTION_VERSE, CANDIDATE_A);
  console.log("✅ Election event resolved successfully");

  // Oracle2 resolves Fed rate: Rate hike
  console.log("🏦 Oracle2 reporting: Fed decides to hike rates!");
  await oracleManager.connect(oracle2).submitOutcome(FED_RATE_VERSE, RATE_HIKE);
  console.log("✅ Fed rate event resolved successfully");

  // Check final event status
  console.log("\n=== Post-Resolution Event Status ===");
  const [, electionResolvedFinal, electionOutcomeFinal] = await oracleManager.getEventStatus(ELECTION_VERSE);
  const [, rateResolvedFinal, rateOutcomeFinal] = await oracleManager.getEventStatus(FED_RATE_VERSE);
  
  console.log(`Election Event - Resolved: ${electionResolvedFinal}, Winner: ${electionOutcomeFinal === CANDIDATE_A ? "Alice" : "Bob"}`);
  console.log(`Fed Rate Event - Resolved: ${rateResolvedFinal}, Decision: ${rateOutcomeFinal === RATE_HIKE ? "Rate Hike" : "Rate Hold"}`);

  // Check verse resolution in ConditionalToken
  console.log("\n=== Verse Resolution Verification ===");
  const [, , electionVerseResolved] = await conditionalToken.verses(ELECTION_VERSE);
  const [, , rateVerseResolved] = await conditionalToken.verses(FED_RATE_VERSE);
  
  console.log(`Election verse resolved in ConditionalToken: ${electionVerseResolved}`);
  console.log(`Fed rate verse resolved in ConditionalToken: ${rateVerseResolved}`);

  // Demonstrate security: unauthorized oracle cannot resolve
  console.log("\n=== Security Demo ===");
  try {
    await oracleManager.connect(user1).submitOutcome(ELECTION_VERSE, CANDIDATE_B);
    console.log("❌ Security failed: unauthorized user resolved event");
  } catch (error) {
    console.log("✅ Security working: unauthorized user blocked from resolving events");
  }

  // Demonstrate double resolution prevention
  try {
    await oracleManager.connect(oracle1).submitOutcome(ELECTION_VERSE, CANDIDATE_B);
    console.log("❌ Security failed: double resolution allowed");
  } catch (error) {
    console.log("✅ Security working: double resolution prevented");
  }

  console.log("\n🎉 OracleManager event resolution test completed!");
  console.log("\nKey Features Demonstrated:");
  console.log("• Authorized oracles can resolve their assigned events");
  console.log("• Events properly update ConditionalToken verse states");
  console.log("• Security prevents unauthorized resolution and double resolution");
  console.log("• Multiple oracles can operate independently");
  console.log("\nThis enables secure, decentralized event resolution for");
  console.log("the Multiverse Finance system!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 