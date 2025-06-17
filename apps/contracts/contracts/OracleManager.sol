// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ConditionalToken.sol";

contract OracleManager is Ownable, ReentrancyGuard {
    ConditionalToken public immutable conditionalToken;
    
    struct Event {
        address oracle;
        bool resolved;
        bytes32 outcome;
        uint256 registrationTime;
    }
    
    mapping(bytes32 => Event) public events;
    mapping(address => bool) public authorizedOracles;
    
    event EventRegistered(bytes32 indexed eventId, address indexed oracle);
    event EventResolved(bytes32 indexed eventId, bytes32 indexed outcome);
    event OracleAuthorized(address indexed oracle, bool authorized);

    constructor(address _conditionalToken) Ownable(msg.sender) {
        conditionalToken = ConditionalToken(_conditionalToken);
        authorizedOracles[msg.sender] = true;
    }

    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        _;
    }

    modifier onlyEventOracle(bytes32 eventId) {
        require(events[eventId].oracle == msg.sender, "Not event oracle");
        _;
    }

    modifier eventExists(bytes32 eventId) {
        require(events[eventId].oracle != address(0), "Event not registered");
        _;
    }

    function setOracleAuthorization(address oracle, bool authorized) external onlyOwner {
        authorizedOracles[oracle] = authorized;
        emit OracleAuthorized(oracle, authorized);
    }

    function registerEvent(bytes32 eventId, address oracle) external onlyOwner {
        require(events[eventId].oracle == address(0), "Event already registered");
        require(authorizedOracles[oracle], "Oracle not authorized");
        
        events[eventId] = Event({
            oracle: oracle,
            resolved: false,
            outcome: bytes32(0),
            registrationTime: block.timestamp
        });
        
        emit EventRegistered(eventId, oracle);
    }

    function submitOutcome(bytes32 eventId, bytes32 outcome) external onlyAuthorizedOracle onlyEventOracle(eventId) nonReentrant {
        Event storage eventData = events[eventId];
        require(!eventData.resolved, "Event already resolved");
        require(outcome != bytes32(0), "Invalid outcome");
        
        eventData.resolved = true;
        eventData.outcome = outcome;
        
        conditionalToken.resolveVerse(eventId, outcome);
        
        emit EventResolved(eventId, outcome);
    }

    function getEventStatus(bytes32 eventId) external view eventExists(eventId) returns (
        address oracle,
        bool resolved,
        bytes32 outcome,
        uint256 registrationTime
    ) {
        Event storage eventData = events[eventId];
        return (
            eventData.oracle,
            eventData.resolved,
            eventData.outcome,
            eventData.registrationTime
        );
    }

    function isEventResolved(bytes32 eventId) external view returns (bool) {
        return events[eventId].resolved;
    }

    function getEventOutcome(bytes32 eventId) external view eventExists(eventId) returns (bytes32) {
        require(events[eventId].resolved, "Event not resolved");
        return events[eventId].outcome;
    }

    function getPendingEvents() external view returns (bytes32[] memory) {
        // Note: This is a view function that requires off-chain indexing for efficiency
        // In production, events would be tracked via event logs
        return new bytes32[](0);
    }
} 