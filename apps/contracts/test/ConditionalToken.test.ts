import { expect } from "chai";
import { ethers } from "hardhat";
import { ConditionalToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ConditionalToken", function () {
  let conditionalToken: ConditionalToken;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  
  const ROOT_VERSE = ethers.ZeroHash;
  const POWELL_FIRED = ethers.keccak256(ethers.toUtf8Bytes("powell_fired"));
  const POWELL_NOT_FIRED = ethers.keccak256(ethers.toUtf8Bytes("powell_not_fired"));

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
    const ConditionalTokenFactory = await ethers.getContractFactory("ConditionalToken");
    conditionalToken = await ConditionalTokenFactory.deploy();
    await conditionalToken.waitForDeployment();
  });

  describe("Verse Management", function () {
    it("Should create root verse on deployment", async function () {
      const rootVerse = await conditionalToken.verses(ROOT_VERSE);
      expect(rootVerse.exists).to.be.true;
      expect(rootVerse.resolved).to.be.false;
    });

    it("Should create child verses", async function () {
      await conditionalToken.createVerse(POWELL_FIRED, ROOT_VERSE);
      await conditionalToken.createVerse(POWELL_NOT_FIRED, ROOT_VERSE);
      
      const firedVerse = await conditionalToken.verses(POWELL_FIRED);
      const notFiredVerse = await conditionalToken.verses(POWELL_NOT_FIRED);
      
      expect(firedVerse.exists).to.be.true;
      expect(firedVerse.parent).to.equal(ROOT_VERSE);
      expect(notFiredVerse.exists).to.be.true;
      expect(notFiredVerse.parent).to.equal(ROOT_VERSE);
    });

    it("Should create partitions", async function () {
      await conditionalToken.createVerse(POWELL_FIRED, ROOT_VERSE);
      await conditionalToken.createVerse(POWELL_NOT_FIRED, ROOT_VERSE);
      
      await conditionalToken.createPartition(ROOT_VERSE, [POWELL_FIRED, POWELL_NOT_FIRED]);
      
      expect(await conditionalToken.partitions(ROOT_VERSE, POWELL_FIRED)).to.be.true;
      expect(await conditionalToken.partitions(ROOT_VERSE, POWELL_NOT_FIRED)).to.be.true;
    });


  });

  describe("Token Operations", function () {
    beforeEach(async function () {
      await conditionalToken.createVerse(POWELL_FIRED, ROOT_VERSE);
      await conditionalToken.createVerse(POWELL_NOT_FIRED, ROOT_VERSE);
      await conditionalToken.createPartition(ROOT_VERSE, [POWELL_FIRED, POWELL_NOT_FIRED]);
    });

    it("Should mint tokens in verses", async function () {
      const amount = ethers.parseEther("100");
      const rootTokenId = await conditionalToken.getTokenId(ROOT_VERSE);
      
      await conditionalToken.mintToken(user.address, ROOT_VERSE, amount);
      
      const balance = await conditionalToken.balanceOf(user.address, rootTokenId);
      expect(balance).to.equal(amount);
    });

    it("Should split ownership from parent to children", async function () {
      const amount = ethers.parseEther("100");
      const rootTokenId = await conditionalToken.getTokenId(ROOT_VERSE);
      const firedTokenId = await conditionalToken.getTokenId(POWELL_FIRED);
      const notFiredTokenId = await conditionalToken.getTokenId(POWELL_NOT_FIRED);
      
      await conditionalToken.mintToken(user.address, ROOT_VERSE, amount);
      
      await conditionalToken.connect(user).splitOwnership(
        ROOT_VERSE,
        [POWELL_FIRED, POWELL_NOT_FIRED],
        amount
      );
      
      expect(await conditionalToken.balanceOf(user.address, rootTokenId)).to.equal(0);
      expect(await conditionalToken.balanceOf(user.address, firedTokenId)).to.equal(amount);
      expect(await conditionalToken.balanceOf(user.address, notFiredTokenId)).to.equal(amount);
    });

    it("Should combine ownership from children to parent", async function () {
      const amount = ethers.parseEther("100");
      const rootTokenId = await conditionalToken.getTokenId(ROOT_VERSE);
      const firedTokenId = await conditionalToken.getTokenId(POWELL_FIRED);
      const notFiredTokenId = await conditionalToken.getTokenId(POWELL_NOT_FIRED);
      
      await conditionalToken.mintToken(user.address, POWELL_FIRED, amount);
      await conditionalToken.mintToken(user.address, POWELL_NOT_FIRED, amount);
      
      await conditionalToken.connect(user).combineOwnership(
        [POWELL_FIRED, POWELL_NOT_FIRED],
        ROOT_VERSE,
        amount
      );
      
      expect(await conditionalToken.balanceOf(user.address, firedTokenId)).to.equal(0);
      expect(await conditionalToken.balanceOf(user.address, notFiredTokenId)).to.equal(0);
      expect(await conditionalToken.balanceOf(user.address, rootTokenId)).to.equal(amount);
    });
  });

  describe("Verse Resolution", function () {
    beforeEach(async function () {
      await conditionalToken.createVerse(POWELL_FIRED, ROOT_VERSE);
      await conditionalToken.createVerse(POWELL_NOT_FIRED, ROOT_VERSE);
      await conditionalToken.createPartition(ROOT_VERSE, [POWELL_FIRED, POWELL_NOT_FIRED]);
    });

    it("Should resolve verse and evaporate losing verses", async function () {
      const amount = ethers.parseEther("100");
      
      await conditionalToken.mintToken(user.address, POWELL_FIRED, amount);
      await conditionalToken.mintToken(user.address, POWELL_NOT_FIRED, amount);
      
      await expect(conditionalToken.resolveVerse(ROOT_VERSE, POWELL_NOT_FIRED))
        .to.emit(conditionalToken, "VerseEvaporated")
        .withArgs(POWELL_FIRED);
      
      const rootVerse = await conditionalToken.verses(ROOT_VERSE);
      const firedVerse = await conditionalToken.verses(POWELL_FIRED);
      const notFiredVerse = await conditionalToken.verses(POWELL_NOT_FIRED);
      
      expect(rootVerse.resolved).to.be.true;
      expect(firedVerse.resolved).to.be.true; // evaporated
      expect(notFiredVerse.resolved).to.be.false; // winning verse
      
      expect(await conditionalToken.resolvedOutcome(ROOT_VERSE)).to.equal(POWELL_NOT_FIRED);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to create verses", async function () {
      await expect(
        conditionalToken.connect(user).createVerse(POWELL_FIRED, ROOT_VERSE)
      ).to.be.revertedWithCustomError(conditionalToken, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to mint tokens", async function () {
      await expect(
        conditionalToken.connect(user).mintToken(user.address, ROOT_VERSE, 100)
      ).to.be.revertedWithCustomError(conditionalToken, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to resolve verses", async function () {
      await expect(
        conditionalToken.connect(user).resolveVerse(ROOT_VERSE, POWELL_FIRED)
      ).to.be.revertedWithCustomError(conditionalToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Utility Functions", function () {
    it("Should generate consistent token IDs", async function () {
      const rootTokenId1 = await conditionalToken.getTokenId(ROOT_VERSE);
      const rootTokenId2 = await conditionalToken.getTokenId(ROOT_VERSE);
      
      expect(rootTokenId1).to.equal(rootTokenId2);
    });

    it("Should validate partitions correctly", async function () {
      await conditionalToken.createVerse(POWELL_FIRED, ROOT_VERSE);
      await conditionalToken.createVerse(POWELL_NOT_FIRED, ROOT_VERSE);
      await conditionalToken.createPartition(ROOT_VERSE, [POWELL_FIRED, POWELL_NOT_FIRED]);
      
      expect(await conditionalToken.isValidPartition(ROOT_VERSE, [POWELL_FIRED, POWELL_NOT_FIRED])).to.be.true;
      expect(await conditionalToken.isValidPartition(ROOT_VERSE, [POWELL_FIRED])).to.be.false;
    });
  });
}); 