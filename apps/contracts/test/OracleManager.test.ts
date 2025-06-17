import { expect } from "chai";
import { ethers } from "hardhat";
import { ConditionalToken, OracleManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("OracleManager", function () {
  let conditionalToken: ConditionalToken;
  let oracleManager: OracleManager;
  let owner: SignerWithAddress;
  let oracle1: SignerWithAddress;
  let oracle2: SignerWithAddress;
  let unauthorized: SignerWithAddress;
  
  const ROOT_VERSE = ethers.ZeroHash;
  const ELECTION_VERSE = ethers.keccak256(ethers.toUtf8Bytes("election_verse"));
  const RATE_VERSE = ethers.keccak256(ethers.toUtf8Bytes("rate_verse"));
  const CANDIDATE_A = ethers.keccak256(ethers.toUtf8Bytes("candidate_a"));
  const CANDIDATE_B = ethers.keccak256(ethers.toUtf8Bytes("candidate_b"));
  const RATE_HIKE = ethers.keccak256(ethers.toUtf8Bytes("rate_hike"));
  const RATE_HOLD = ethers.keccak256(ethers.toUtf8Bytes("rate_hold"));

  beforeEach(async function () {
    [owner, oracle1, oracle2, unauthorized] = await ethers.getSigners();
    
    // Deploy ConditionalToken
    const ConditionalTokenFactory = await ethers.getContractFactory("ConditionalToken");
    conditionalToken = await ConditionalTokenFactory.deploy();
    await conditionalToken.waitForDeployment();
    
    // Deploy OracleManager
    const OracleManagerFactory = await ethers.getContractFactory("OracleManager");
    oracleManager = await OracleManagerFactory.deploy(await conditionalToken.getAddress());
    await oracleManager.waitForDeployment();
    
    // Setup verses for event resolution
    await conditionalToken.createVerse(ELECTION_VERSE, ROOT_VERSE);
    await conditionalToken.createVerse(CANDIDATE_A, ELECTION_VERSE);
    await conditionalToken.createVerse(CANDIDATE_B, ELECTION_VERSE);
    await conditionalToken.createPartition(ELECTION_VERSE, [CANDIDATE_A, CANDIDATE_B]);
    
    await conditionalToken.createVerse(RATE_VERSE, ROOT_VERSE);
    await conditionalToken.createVerse(RATE_HIKE, RATE_VERSE);
    await conditionalToken.createVerse(RATE_HOLD, RATE_VERSE);
    await conditionalToken.createPartition(RATE_VERSE, [RATE_HIKE, RATE_HOLD]);
    
    // Transfer ConditionalToken ownership to OracleManager
    await conditionalToken.transferOwnership(await oracleManager.getAddress());
  });

  describe("Access Control", function () {
    it("Should set deployer as authorized oracle", async function () {
      expect(await oracleManager.authorizedOracles(owner.address)).to.be.true;
    });

    it("Should allow owner to authorize oracles", async function () {
      await expect(
        oracleManager.setOracleAuthorization(oracle1.address, true)
      ).to.emit(oracleManager, "OracleAuthorized")
        .withArgs(oracle1.address, true);

      expect(await oracleManager.authorizedOracles(oracle1.address)).to.be.true;
    });

    it("Should allow owner to revoke oracle authorization", async function () {
      await oracleManager.setOracleAuthorization(oracle1.address, true);
      await oracleManager.setOracleAuthorization(oracle1.address, false);
      
      expect(await oracleManager.authorizedOracles(oracle1.address)).to.be.false;
    });

    it("Should prevent unauthorized users from authorizing oracles", async function () {
      await expect(
        oracleManager.connect(unauthorized).setOracleAuthorization(oracle1.address, true)
      ).to.be.revertedWithCustomError(oracleManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Event Registration", function () {
    beforeEach(async function () {
      await oracleManager.setOracleAuthorization(oracle1.address, true);
    });

    it("Should register event with authorized oracle", async function () {
      await expect(
        oracleManager.registerEvent(ELECTION_VERSE, oracle1.address)
      ).to.emit(oracleManager, "EventRegistered")
        .withArgs(ELECTION_VERSE, oracle1.address);

      const [oracle, resolved, outcome, registrationTime] = await oracleManager.getEventStatus(ELECTION_VERSE);
      expect(oracle).to.equal(oracle1.address);
      expect(resolved).to.be.false;
      expect(outcome).to.equal(ethers.ZeroHash);
      expect(registrationTime).to.be.greaterThan(0);
    });

    it("Should prevent registering event with unauthorized oracle", async function () {
      await expect(
        oracleManager.registerEvent(ELECTION_VERSE, oracle2.address)
      ).to.be.revertedWith("Oracle not authorized");
    });

    it("Should prevent duplicate event registration", async function () {
      await oracleManager.registerEvent(ELECTION_VERSE, oracle1.address);
      
      await expect(
        oracleManager.registerEvent(ELECTION_VERSE, oracle1.address)
      ).to.be.revertedWith("Event already registered");
    });

    it("Should prevent unauthorized users from registering events", async function () {
      await expect(
        oracleManager.connect(unauthorized).registerEvent(ELECTION_VERSE, oracle1.address)
      ).to.be.revertedWithCustomError(oracleManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Event Resolution", function () {
    beforeEach(async function () {
      await oracleManager.setOracleAuthorization(oracle1.address, true);
      await oracleManager.setOracleAuthorization(oracle2.address, true);
      await oracleManager.registerEvent(ELECTION_VERSE, oracle1.address);
      await oracleManager.registerEvent(RATE_VERSE, oracle2.address);
    });

    it("Should resolve event and call ConditionalToken", async function () {
      await expect(
        oracleManager.connect(oracle1).submitOutcome(ELECTION_VERSE, CANDIDATE_A)
      ).to.emit(oracleManager, "EventResolved")
        .withArgs(ELECTION_VERSE, CANDIDATE_A);

      const [oracle, resolved, outcome] = await oracleManager.getEventStatus(ELECTION_VERSE);
      expect(resolved).to.be.true;
      expect(outcome).to.equal(CANDIDATE_A);

      // Check that verse was resolved in ConditionalToken
      const [, , verseResolved,] = await conditionalToken.verses(ELECTION_VERSE);
      expect(verseResolved).to.be.true;
    });

    it("Should prevent unauthorized oracle from resolving event", async function () {
      await expect(
        oracleManager.connect(oracle2).submitOutcome(ELECTION_VERSE, CANDIDATE_A)
      ).to.be.revertedWith("Not event oracle");
    });

    it("Should prevent non-authorized addresses from resolving events", async function () {
      await expect(
        oracleManager.connect(unauthorized).submitOutcome(ELECTION_VERSE, CANDIDATE_A)
      ).to.be.revertedWith("Not authorized oracle");
    });

    it("Should prevent double resolution", async function () {
      await oracleManager.connect(oracle1).submitOutcome(ELECTION_VERSE, CANDIDATE_A);
      
      await expect(
        oracleManager.connect(oracle1).submitOutcome(ELECTION_VERSE, CANDIDATE_B)
      ).to.be.revertedWith("Event already resolved");
    });

    it("Should prevent invalid outcome", async function () {
      await expect(
        oracleManager.connect(oracle1).submitOutcome(ELECTION_VERSE, ethers.ZeroHash)
      ).to.be.revertedWith("Invalid outcome");
    });

    it("Should prevent resolving non-existent event", async function () {
      const fakeEvent = ethers.keccak256(ethers.toUtf8Bytes("fake_event"));
      
      await expect(
        oracleManager.connect(oracle1).submitOutcome(fakeEvent, CANDIDATE_A)
      ).to.be.revertedWith("Not event oracle");
    });
  });

  describe("Event Status Queries", function () {
    beforeEach(async function () {
      await oracleManager.setOracleAuthorization(oracle1.address, true);
      await oracleManager.registerEvent(ELECTION_VERSE, oracle1.address);
    });

    it("Should return correct event status before resolution", async function () {
      const [oracle, resolved, outcome, registrationTime] = await oracleManager.getEventStatus(ELECTION_VERSE);
      
      expect(oracle).to.equal(oracle1.address);
      expect(resolved).to.be.false;
      expect(outcome).to.equal(ethers.ZeroHash);
      expect(registrationTime).to.be.greaterThan(0);
    });

    it("Should return correct event status after resolution", async function () {
      await oracleManager.connect(oracle1).submitOutcome(ELECTION_VERSE, CANDIDATE_A);
      
      const [oracle, resolved, outcome, registrationTime] = await oracleManager.getEventStatus(ELECTION_VERSE);
      
      expect(oracle).to.equal(oracle1.address);
      expect(resolved).to.be.true;
      expect(outcome).to.equal(CANDIDATE_A);
      expect(registrationTime).to.be.greaterThan(0);
    });

    it("Should return resolution status correctly", async function () {
      expect(await oracleManager.isEventResolved(ELECTION_VERSE)).to.be.false;
      
      await oracleManager.connect(oracle1).submitOutcome(ELECTION_VERSE, CANDIDATE_A);
      
      expect(await oracleManager.isEventResolved(ELECTION_VERSE)).to.be.true;
    });

    it("Should return event outcome after resolution", async function () {
      await oracleManager.connect(oracle1).submitOutcome(ELECTION_VERSE, CANDIDATE_A);
      
      expect(await oracleManager.getEventOutcome(ELECTION_VERSE)).to.equal(CANDIDATE_A);
    });

    it("Should prevent getting outcome of unresolved event", async function () {
      await expect(
        oracleManager.getEventOutcome(ELECTION_VERSE)
      ).to.be.revertedWith("Event not resolved");
    });

    it("Should prevent querying non-existent event", async function () {
      const fakeEvent = ethers.keccak256(ethers.toUtf8Bytes("fake_event"));
      
      await expect(
        oracleManager.getEventStatus(fakeEvent)
      ).to.be.revertedWith("Event not registered");
    });
  });

  describe("Integration with ConditionalToken", function () {
    beforeEach(async function () {
      await oracleManager.setOracleAuthorization(oracle1.address, true);
      await oracleManager.registerEvent(ELECTION_VERSE, oracle1.address);
    });

    it("Should properly resolve verses when events are resolved", async function () {
      // Check initial verse states
      const [, , resolvedElection] = await conditionalToken.verses(ELECTION_VERSE);
      expect(resolvedElection).to.be.false;

      // Resolve event via OracleManager
      await oracleManager.connect(oracle1).submitOutcome(ELECTION_VERSE, CANDIDATE_A);

      // Check that verse was resolved
      const [, , resolvedElection2] = await conditionalToken.verses(ELECTION_VERSE);
      expect(resolvedElection2).to.be.true;
    });
  });
}); 