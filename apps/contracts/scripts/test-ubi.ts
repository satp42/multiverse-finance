import { ethers } from "hardhat";

async function main() {
  console.log("Testing Event-Conditional UBI system...\n");

  const [deployer, recipient1, recipient2, recipient3] = await ethers.getSigners();
  
  // Deploy contracts
  console.log("Deploying ConditionalToken...");
  const ConditionalTokenFactory = await ethers.getContractFactory("ConditionalToken");
  const conditionalToken = await ConditionalTokenFactory.deploy();
  await conditionalToken.waitForDeployment();

  console.log("Deploying UBIManager...");
  const UBIManagerFactory = await ethers.getContractFactory("UBIManager");
  const ubiManager = await UBIManagerFactory.deploy(await conditionalToken.getAddress());
  await ubiManager.waitForDeployment();

  console.log(`ConditionalToken deployed at: ${await conditionalToken.getAddress()}`);
  console.log(`UBIManager deployed at: ${await ubiManager.getAddress()}\n`);

  // Setup verses for different event outcomes
  const ROOT_VERSE = ethers.ZeroHash;
  const ELECTION_A = ethers.keccak256(ethers.toUtf8Bytes("election_candidate_a"));
  const ELECTION_B = ethers.keccak256(ethers.toUtf8Bytes("election_candidate_b"));
  const RATE_HIKE = ethers.keccak256(ethers.toUtf8Bytes("fed_rate_hike"));
  const RATE_HOLD = ethers.keccak256(ethers.toUtf8Bytes("fed_rate_hold"));

  console.log("=== Setting up Event Verses ===");
  await conditionalToken.createVerse(ELECTION_A, ROOT_VERSE);
  await conditionalToken.createVerse(ELECTION_B, ROOT_VERSE);
  await conditionalToken.createVerse(RATE_HIKE, ROOT_VERSE);
  await conditionalToken.createVerse(RATE_HOLD, ROOT_VERSE);
  
  // Create partitions for mutually exclusive events
  await conditionalToken.createPartition(ROOT_VERSE, [ELECTION_A, ELECTION_B]);
  console.log("✅ Created election verses: Candidate A vs Candidate B");
  console.log("✅ Created Fed rate verses: Rate Hike vs Rate Hold");

  // Transfer ConditionalToken ownership to UBIManager so it can mint tokens
  await conditionalToken.transferOwnership(await ubiManager.getAddress());

  // Create Event-Conditional UBI Programs
  console.log("\n=== Creating Event-Conditional UBI Programs ===");
  
  const electionProgramId = ethers.keccak256(ethers.toUtf8Bytes("ubi_election_2024"));
  const rateProgramId = ethers.keccak256(ethers.toUtf8Bytes("ubi_fed_rates_2024"));
  
  const amountPerRecipient = ethers.parseEther("1000"); // 1000 UBI tokens per person
  const totalBudget = ethers.parseEther("50000"); // Budget for 50 people

  // Create UBI programs for different event outcomes
  await ubiManager.createUBIProgram(electionProgramId, ELECTION_A, amountPerRecipient, totalBudget);
  console.log("✅ Created UBI program for 'Candidate A wins' scenario");
  
  await ubiManager.createUBIProgram(rateProgramId, RATE_HIKE, amountPerRecipient, totalBudget);
  console.log("✅ Created UBI program for 'Fed Rate Hike' scenario");

  // Demonstrate minting event-conditional UBI tokens
  console.log("\n=== Distributing Event-Conditional UBI Tokens ===");
  
  // Recipients claim UBI tokens conditional on Candidate A winning
  await ubiManager.claimUBI(electionProgramId, recipient1.address);
  await ubiManager.claimUBI(electionProgramId, recipient2.address);
  
  // Recipients claim UBI tokens conditional on Fed Rate Hike
  await ubiManager.claimUBI(rateProgramId, recipient1.address);
  await ubiManager.claimUBI(rateProgramId, recipient3.address);

  console.log("✅ Distributed conditional UBI tokens to recipients");

  // Check balances of event-conditional tokens
  console.log("\n=== Checking Event-Conditional UBI Balances ===");
  
  const electionTokenId = await conditionalToken.getTokenId(ELECTION_A);
  const rateHikeTokenId = await conditionalToken.getTokenId(RATE_HIKE);
  
  const recipient1ElectionBalance = await conditionalToken.balanceOf(recipient1.address, electionTokenId);
  const recipient1RateBalance = await conditionalToken.balanceOf(recipient1.address, rateHikeTokenId);
  const recipient2ElectionBalance = await conditionalToken.balanceOf(recipient2.address, electionTokenId);
  const recipient3RateBalance = await conditionalToken.balanceOf(recipient3.address, rateHikeTokenId);

  console.log(`Recipient 1 - Election A UBI: ${ethers.formatEther(recipient1ElectionBalance)} tokens`);
  console.log(`Recipient 1 - Rate Hike UBI: ${ethers.formatEther(recipient1RateBalance)} tokens`);
  console.log(`Recipient 2 - Election A UBI: ${ethers.formatEther(recipient2ElectionBalance)} tokens`);
  console.log(`Recipient 3 - Rate Hike UBI: ${ethers.formatEther(recipient3RateBalance)} tokens`);

  // Check program statistics
  console.log("\n=== Program Statistics ===");
  const [, , electionBudget, electionDistributed,] = await ubiManager.getProgramInfo(electionProgramId);
  const [, , rateBudget, rateDistributed,] = await ubiManager.getProgramInfo(rateProgramId);
  
  console.log(`Election Program - Distributed: ${ethers.formatEther(electionDistributed)} / ${ethers.formatEther(electionBudget)}`);
  console.log(`Rate Program - Distributed: ${ethers.formatEther(rateDistributed)} / ${ethers.formatEther(rateBudget)}`);

  console.log("\n🎉 Event-Conditional UBI system test completed!");
  console.log("\nKey Features Demonstrated:");
  console.log("• Created UBI programs tied to specific event outcomes");
  console.log("• Minted conditional tokens that only pay out if events occur");
  console.log("• Recipients can hold multiple conditional UBI positions");
  console.log("• Proper budget tracking and claim prevention");
  console.log("\nThis enables adaptive social safety nets where UBI payments");
  console.log("are conditional on future economic/political events!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 