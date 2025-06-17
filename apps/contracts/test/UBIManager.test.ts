import { expect } from "chai";
import { ethers } from "hardhat";
import { ConditionalToken, UBIManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("UBIManager", function () {
  let conditionalToken: ConditionalToken;
  let ubiManager: UBIManager;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let recipient1: SignerWithAddress;
  let recipient2: SignerWithAddress;
  let unauthorized: SignerWithAddress;
  
  const ROOT_VERSE = ethers.ZeroHash;
  const ELECTION_A = ethers.keccak256(ethers.toUtf8Bytes("election_a"));
  const ELECTION_B = ethers.keccak256(ethers.toUtf8Bytes("election_b"));
  const RATE_HIKE = ethers.keccak256(ethers.toUtf8Bytes("rate_hike"));

  beforeEach(async function () {
    [owner, minter, recipient1, recipient2, unauthorized] = await ethers.getSigners();
    
    // Deploy ConditionalToken
    const ConditionalTokenFactory = await ethers.getContractFactory("ConditionalToken");
    conditionalToken = await ConditionalTokenFactory.deploy();
    await conditionalToken.waitForDeployment();
    
    // Deploy UBIManager
    const UBIManagerFactory = await ethers.getContractFactory("UBIManager");
    ubiManager = await UBIManagerFactory.deploy(await conditionalToken.getAddress());
    await ubiManager.waitForDeployment();
    
    // Setup verses for event-conditional UBI
    await conditionalToken.createVerse(ELECTION_A, ROOT_VERSE);
    await conditionalToken.createVerse(ELECTION_B, ROOT_VERSE);
    await conditionalToken.createVerse(RATE_HIKE, ROOT_VERSE);
    await conditionalToken.createPartition(ROOT_VERSE, [ELECTION_A, ELECTION_B]);
    
    // Authorize UBIManager to mint tokens in ConditionalToken
    await conditionalToken.transferOwnership(await ubiManager.getAddress());
  });

  describe("Access Control", function () {
    it("Should set deployer as authorized minter", async function () {
      expect(await ubiManager.authorizedMinters(owner.address)).to.be.true;
    });

    it("Should allow owner to authorize new minters", async function () {
      await ubiManager.setMinterAuthorization(minter.address, true);
      expect(await ubiManager.authorizedMinters(minter.address)).to.be.true;
    });

    it("Should prevent unauthorized users from authorizing minters", async function () {
      await expect(
        ubiManager.connect(unauthorized).setMinterAuthorization(minter.address, true)
      ).to.be.revertedWithCustomError(ubiManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("UBI Program Creation", function () {
    const programId = ethers.keccak256(ethers.toUtf8Bytes("ubi_election_2024"));
    const amountPerRecipient = ethers.parseEther("1000");
    const totalBudget = ethers.parseEther("100000");

    it("Should create UBI program for event-conditional tokens", async function () {
      await expect(
        ubiManager.createUBIProgram(programId, ELECTION_A, amountPerRecipient, totalBudget)
      ).to.emit(ubiManager, "UBIProgramCreated")
        .withArgs(programId, ELECTION_A, amountPerRecipient, totalBudget);

      const [verseId, amount, budget, distributed, active] = await ubiManager.getProgramInfo(programId);
      expect(verseId).to.equal(ELECTION_A);
      expect(amount).to.equal(amountPerRecipient);
      expect(budget).to.equal(totalBudget);
      expect(distributed).to.equal(0);
      expect(active).to.be.true;
    });

    it("Should prevent creating program with non-existent verse", async function () {
      const fakeVerse = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      
      await expect(
        ubiManager.createUBIProgram(programId, fakeVerse, amountPerRecipient, totalBudget)
      ).to.be.revertedWith("Verse does not exist");
    });

    it("Should prevent unauthorized users from creating programs", async function () {
      await expect(
        ubiManager.connect(unauthorized).createUBIProgram(programId, ELECTION_A, amountPerRecipient, totalBudget)
      ).to.be.revertedWith("Not authorized minter");
    });

    it("Should prevent duplicate program IDs", async function () {
      await ubiManager.createUBIProgram(programId, ELECTION_A, amountPerRecipient, totalBudget);
      
      await expect(
        ubiManager.createUBIProgram(programId, ELECTION_B, amountPerRecipient, totalBudget)
      ).to.be.revertedWith("Program already exists");
    });
  });

  describe("UBI Token Minting", function () {
    const programId = ethers.keccak256(ethers.toUtf8Bytes("ubi_election_2024"));
    const amountPerRecipient = ethers.parseEther("1000");
    const totalBudget = ethers.parseEther("100000");

    beforeEach(async function () {
      await ubiManager.createUBIProgram(programId, ELECTION_A, amountPerRecipient, totalBudget);
    });

    it("Should mint event-conditional UBI tokens", async function () {
      const tokenId = await conditionalToken.getTokenId(ELECTION_A);
      
      await expect(
        ubiManager.claimUBI(programId, recipient1.address)
      ).to.emit(ubiManager, "UBIClaimed")
        .withArgs(programId, recipient1.address, amountPerRecipient);

      const balance = await conditionalToken.balanceOf(recipient1.address, tokenId);
      expect(balance).to.equal(amountPerRecipient);
      
      expect(await ubiManager.hasClaimedUBI(programId, recipient1.address)).to.be.true;
    });

    it("Should prevent double claiming", async function () {
      await ubiManager.claimUBI(programId, recipient1.address);
      
      await expect(
        ubiManager.claimUBI(programId, recipient1.address)
      ).to.be.revertedWith("Already claimed");
    });

    it("Should track distributed amounts correctly", async function () {
      await ubiManager.claimUBI(programId, recipient1.address);
      await ubiManager.claimUBI(programId, recipient2.address);
      
      const [, , , distributed,] = await ubiManager.getProgramInfo(programId);
      expect(distributed).to.equal(amountPerRecipient * 2n);
      
      const remaining = await ubiManager.getRemainingBudget(programId);
      expect(remaining).to.equal(totalBudget - (amountPerRecipient * 2n));
    });

    it("Should prevent claiming when budget exceeded", async function () {
      const smallBudget = ethers.parseEther("1500");
      const smallProgramId = ethers.keccak256(ethers.toUtf8Bytes("small_program"));
      
      await ubiManager.createUBIProgram(smallProgramId, ELECTION_B, amountPerRecipient, smallBudget);
      
      await ubiManager.claimUBI(smallProgramId, recipient1.address);
      
      await expect(
        ubiManager.claimUBI(smallProgramId, recipient2.address)
      ).to.be.revertedWith("Budget exceeded");
    });
  });

  describe("Batch Operations", function () {
    const programId = ethers.keccak256(ethers.toUtf8Bytes("ubi_election_2024"));
    const amountPerRecipient = ethers.parseEther("1000");
    const totalBudget = ethers.parseEther("100000");

    beforeEach(async function () {
      await ubiManager.createUBIProgram(programId, ELECTION_A, amountPerRecipient, totalBudget);
    });

    it("Should batch claim UBI for multiple recipients", async function () {
      const recipients = [recipient1.address, recipient2.address];
      const tokenId = await conditionalToken.getTokenId(ELECTION_A);
      
      await ubiManager.batchClaimUBI(programId, recipients);
      
      const balance1 = await conditionalToken.balanceOf(recipient1.address, tokenId);
      const balance2 = await conditionalToken.balanceOf(recipient2.address, tokenId);
      
      expect(balance1).to.equal(amountPerRecipient);
      expect(balance2).to.equal(amountPerRecipient);
      
      const [, , , distributed,] = await ubiManager.getProgramInfo(programId);
      expect(distributed).to.equal(amountPerRecipient * 2n);
    });
  });

  describe("Program Management", function () {
    const programId = ethers.keccak256(ethers.toUtf8Bytes("ubi_election_2024"));
    const amountPerRecipient = ethers.parseEther("1000");
    const totalBudget = ethers.parseEther("100000");

    beforeEach(async function () {
      await ubiManager.createUBIProgram(programId, ELECTION_A, amountPerRecipient, totalBudget);
    });

    it("Should allow owner to toggle program active status", async function () {
      await expect(
        ubiManager.toggleProgramActive(programId)
      ).to.emit(ubiManager, "UBIProgramUpdated")
        .withArgs(programId, false);

      const [, , , , active] = await ubiManager.getProgramInfo(programId);
      expect(active).to.be.false;
    });

    it("Should prevent claiming from inactive programs", async function () {
      await ubiManager.toggleProgramActive(programId);
      
      await expect(
        ubiManager.claimUBI(programId, recipient1.address)
      ).to.be.revertedWith("Program not active");
    });
  });

  describe("Event Resolution Integration", function () {
    const programId = ethers.keccak256(ethers.toUtf8Bytes("ubi_election_2024"));
    const amountPerRecipient = ethers.parseEther("1000");
    const totalBudget = ethers.parseEther("100000");

    it("Should prevent claiming from resolved verses", async function () {
      await ubiManager.createUBIProgram(programId, ELECTION_A, amountPerRecipient, totalBudget);
      
      // Transfer ownership back to test account to resolve verse
      await ubiManager.transferOwnership(owner.address);
      await conditionalToken.connect(owner).transferOwnership(owner.address);
      
      // Resolve the verse
      await conditionalToken.resolveVerse(ROOT_VERSE, ELECTION_B);
      
      // Transfer ownership back to UBIManager
      await conditionalToken.transferOwnership(await ubiManager.getAddress());
      await ubiManager.transferOwnership(await ubiManager.getAddress());
      
      await expect(
        ubiManager.claimUBI(programId, recipient1.address)
      ).to.be.revertedWith("Verse resolved or does not exist");
    });
  });
}); 