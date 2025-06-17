// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ConditionalToken.sol";

contract UBIManager is Ownable, ReentrancyGuard {
    ConditionalToken public immutable conditionalToken;
    
    struct UBIProgram {
        bytes32 verseId;
        uint256 amountPerRecipient;
        uint256 totalBudget;
        uint256 distributedAmount;
        bool active;
        mapping(address => bool) hasClaimed;
    }
    
    mapping(bytes32 => UBIProgram) public ubiPrograms;
    mapping(address => bool) public authorizedMinters;
    
    event UBIProgramCreated(bytes32 indexed programId, bytes32 indexed verseId, uint256 amountPerRecipient, uint256 totalBudget);
    event UBIClaimed(bytes32 indexed programId, address indexed recipient, uint256 amount);
    event UBIProgramUpdated(bytes32 indexed programId, bool active);
    event MinterAuthorized(address indexed minter, bool authorized);

    constructor(address _conditionalToken) Ownable(msg.sender) {
        conditionalToken = ConditionalToken(_conditionalToken);
        authorizedMinters[msg.sender] = true;
    }

    modifier onlyActiveMinter() {
        require(authorizedMinters[msg.sender], "Not authorized minter");
        _;
    }

    modifier verseExists(bytes32 verseId) {
        (, , bool resolved, bool exists) = conditionalToken.verses(verseId);
        require(exists, "Verse does not exist");
        require(!resolved, "Verse already resolved");
        _;
    }

    function setMinterAuthorization(address minter, bool authorized) external onlyOwner {
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }

    function createUBIProgram(
        bytes32 programId,
        bytes32 verseId,
        uint256 amountPerRecipient,
        uint256 totalBudget
    ) external onlyActiveMinter verseExists(verseId) {
        require(ubiPrograms[programId].verseId == bytes32(0), "Program already exists");
        require(amountPerRecipient > 0, "Amount must be positive");
        require(totalBudget >= amountPerRecipient, "Budget too small");
        
        UBIProgram storage program = ubiPrograms[programId];
        program.verseId = verseId;
        program.amountPerRecipient = amountPerRecipient;
        program.totalBudget = totalBudget;
        program.distributedAmount = 0;
        program.active = true;
        
        emit UBIProgramCreated(programId, verseId, amountPerRecipient, totalBudget);
    }

    function claimUBI(bytes32 programId, address recipient) external onlyActiveMinter nonReentrant {
        _claimUBI(programId, recipient);
    }

    function batchClaimUBI(bytes32 programId, address[] calldata recipients) external onlyActiveMinter nonReentrant {
        for (uint256 i = 0; i < recipients.length; i++) {
            _claimUBI(programId, recipients[i]);
        }
    }

    function _claimUBI(bytes32 programId, address recipient) internal {
        UBIProgram storage program = ubiPrograms[programId];
        require(program.verseId != bytes32(0), "Program does not exist");
        require(program.active, "Program not active");
        require(!program.hasClaimed[recipient], "Already claimed");
        require(program.distributedAmount + program.amountPerRecipient <= program.totalBudget, "Budget exceeded");
        
        (, , bool resolved, bool exists) = conditionalToken.verses(program.verseId);
        require(exists && !resolved, "Verse resolved or does not exist");
        
        program.hasClaimed[recipient] = true;
        program.distributedAmount += program.amountPerRecipient;
        
        conditionalToken.mintToken(recipient, program.verseId, program.amountPerRecipient);
        
        emit UBIClaimed(programId, recipient, program.amountPerRecipient);
    }

    function toggleProgramActive(bytes32 programId) external onlyOwner {
        UBIProgram storage program = ubiPrograms[programId];
        require(program.verseId != bytes32(0), "Program does not exist");
        
        program.active = !program.active;
        emit UBIProgramUpdated(programId, program.active);
    }

    function hasClaimedUBI(bytes32 programId, address recipient) external view returns (bool) {
        return ubiPrograms[programId].hasClaimed[recipient];
    }

    function getProgramInfo(bytes32 programId) external view returns (
        bytes32 verseId,
        uint256 amountPerRecipient,
        uint256 totalBudget,
        uint256 distributedAmount,
        bool active
    ) {
        UBIProgram storage program = ubiPrograms[programId];
        return (
            program.verseId,
            program.amountPerRecipient,
            program.totalBudget,
            program.distributedAmount,
            program.active
        );
    }

    function getRemainingBudget(bytes32 programId) external view returns (uint256) {
        UBIProgram storage program = ubiPrograms[programId];
        if (program.distributedAmount >= program.totalBudget) {
            return 0;
        }
        return program.totalBudget - program.distributedAmount;
    }
} 