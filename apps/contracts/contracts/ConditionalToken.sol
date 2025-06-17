// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ConditionalToken is ERC1155, Ownable {
    struct Verse {
        bytes32 id;
        bytes32 parent;
        bytes32[] children;
        bool resolved;
        bool exists;
    }

    mapping(bytes32 => Verse) public verses;
    mapping(bytes32 => mapping(bytes32 => bool)) public partitions;
    mapping(bytes32 => bytes32) public resolvedOutcome;
    
    bytes32 public constant ROOT_VERSE = bytes32(0);
    
    event VerseCreated(bytes32 indexed verseId, bytes32 indexed parent);
    event PartitionCreated(bytes32 indexed parent, bytes32[] children);
    event VerseResolved(bytes32 indexed verseId, bytes32 outcome);
    event VerseEvaporated(bytes32 indexed verseId);
    event OwnershipSplit(address indexed user, bytes32 indexed parent, bytes32[] children, uint256 amount);
    event OwnershipCombined(address indexed user, bytes32[] children, bytes32 indexed parent, uint256 amount);

    constructor() ERC1155("") Ownable(msg.sender) {
        verses[ROOT_VERSE] = Verse({
            id: ROOT_VERSE,
            parent: bytes32(0),
            children: new bytes32[](0),
            resolved: false,
            exists: true
        });
    }

    function createVerse(bytes32 verseId, bytes32 parent) external onlyOwner {
        require(!verses[verseId].exists, "Verse already exists");
        require(verses[parent].exists, "Parent verse does not exist");
        require(!verses[parent].resolved, "Parent verse already resolved");
        
        verses[verseId] = Verse({
            id: verseId,
            parent: parent,
            children: new bytes32[](0),
            resolved: false,
            exists: true
        });
        
        verses[parent].children.push(verseId);
        
        emit VerseCreated(verseId, parent);
    }

    function createPartition(bytes32 parent, bytes32[] calldata children) external onlyOwner {
        require(verses[parent].exists, "Parent verse does not exist");
        require(!verses[parent].resolved, "Parent verse already resolved");
        require(children.length > 1, "Partition must have multiple children");
        
        for (uint256 i = 0; i < children.length; i++) {
            require(verses[children[i]].exists, "Child verse does not exist");
            require(verses[children[i]].parent == parent, "Child verse parent mismatch");
            partitions[parent][children[i]] = true;
        }
        
        emit PartitionCreated(parent, children);
    }

    function splitOwnership(
        bytes32 parent,
        bytes32[] calldata children,
        uint256 amount
    ) external {
        require(verses[parent].exists, "Parent verse does not exist");
        require(!verses[parent].resolved, "Parent verse already resolved");
        require(children.length > 1, "Must split into multiple children");
        
        for (uint256 i = 0; i < children.length; i++) {
            require(partitions[parent][children[i]], "Invalid partition");
        }
        
        uint256 parentTokenId = getTokenId(parent);
        require(balanceOf(msg.sender, parentTokenId) >= amount, "Insufficient balance");
        
        _burn(msg.sender, parentTokenId, amount);
        
        for (uint256 i = 0; i < children.length; i++) {
            uint256 childTokenId = getTokenId(children[i]);
            _mint(msg.sender, childTokenId, amount, "");
        }
        
        emit OwnershipSplit(msg.sender, parent, children, amount);
    }

    function combineOwnership(
        bytes32[] calldata children,
        bytes32 parent,
        uint256 amount
    ) external {
        require(verses[parent].exists, "Parent verse does not exist");
        require(!verses[parent].resolved, "Parent verse already resolved");
        require(children.length > 1, "Must combine multiple children");
        
        for (uint256 i = 0; i < children.length; i++) {
            require(partitions[parent][children[i]], "Invalid partition");
            uint256 childTokenId = getTokenId(children[i]);
            require(balanceOf(msg.sender, childTokenId) >= amount, "Insufficient child balance");
        }
        
        for (uint256 i = 0; i < children.length; i++) {
            uint256 childTokenId = getTokenId(children[i]);
            _burn(msg.sender, childTokenId, amount);
        }
        
        uint256 parentTokenId = getTokenId(parent);
        _mint(msg.sender, parentTokenId, amount, "");
        
        emit OwnershipCombined(msg.sender, children, parent, amount);
    }

    function resolveVerse(bytes32 verseId, bytes32 outcome) external onlyOwner {
        require(verses[verseId].exists, "Verse does not exist");
        require(!verses[verseId].resolved, "Verse already resolved");
        
        verses[verseId].resolved = true;
        resolvedOutcome[verseId] = outcome;
        
        bytes32[] memory children = verses[verseId].children;
        for (uint256 i = 0; i < children.length; i++) {
            if (children[i] != outcome) {
                _evaporateVerse(children[i]);
            }
        }
        
        emit VerseResolved(verseId, outcome);
    }

    function _evaporateVerse(bytes32 verseId) internal {
        if (!verses[verseId].exists || verses[verseId].resolved) return;
        
        verses[verseId].resolved = true;
        emit VerseEvaporated(verseId);
        
        bytes32[] memory children = verses[verseId].children;
        for (uint256 i = 0; i < children.length; i++) {
            _evaporateVerse(children[i]);
        }
    }

    function getTokenId(bytes32 verseId) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked("TOKEN", verseId)));
    }

    function mintToken(address to, bytes32 verseId, uint256 amount) external onlyOwner {
        require(verses[verseId].exists, "Verse does not exist");
        require(!verses[verseId].resolved, "Verse already resolved");
        
        uint256 tokenId = getTokenId(verseId);
        _mint(to, tokenId, amount, "");
    }

    function getVerseChildren(bytes32 verseId) external view returns (bytes32[] memory) {
        return verses[verseId].children;
    }

    function isValidPartition(bytes32 parent, bytes32[] calldata children) external view returns (bool) {
        if (children.length <= 1) return false;
        
        for (uint256 i = 0; i < children.length; i++) {
            if (!partitions[parent][children[i]]) return false;
        }
        return true;
    }
} 