// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ConditionalToken.sol";

contract MultiverseAMM is ERC1155Holder, Ownable, ReentrancyGuard {
    struct Pool {
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalShares;
        mapping(address => uint256) shares;
        bool exists;
    }

    ConditionalToken public immutable conditionalToken;
    
    mapping(bytes32 => mapping(uint256 => mapping(uint256 => Pool))) public pools;
    
    event PoolCreated(bytes32 indexed verseId, uint256 indexed tokenA, uint256 indexed tokenB);
    event LiquidityAdded(bytes32 indexed verseId, uint256 indexed tokenA, uint256 indexed tokenB, address provider, uint256 amountA, uint256 amountB, uint256 shares);
    event LiquidityRemoved(bytes32 indexed verseId, uint256 indexed tokenA, uint256 indexed tokenB, address provider, uint256 amountA, uint256 amountB, uint256 shares);
    event Swap(bytes32 indexed verseId, uint256 indexed tokenIn, uint256 indexed tokenOut, address user, uint256 amountIn, uint256 amountOut);
    event PoolEvaporated(bytes32 indexed verseId, uint256 indexed tokenA, uint256 indexed tokenB);

    constructor(address _conditionalToken) Ownable(msg.sender) {
        conditionalToken = ConditionalToken(_conditionalToken);
    }

    modifier onlyActiveVerse(bytes32 verseId) {
        (, , bool resolved, bool exists) = conditionalToken.verses(verseId);
        require(exists, "Verse does not exist");
        require(!resolved, "Verse already resolved");
        _;
    }

    function createPool(bytes32 verseId, uint256 tokenA, uint256 tokenB) external onlyActiveVerse(verseId) {
        require(tokenA != tokenB, "Identical tokens");
        
        (uint256 token0, uint256 token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        
        require(!pools[verseId][token0][token1].exists, "Pool already exists");
        
        pools[verseId][token0][token1].exists = true;
        
        emit PoolCreated(verseId, token0, token1);
    }

    function addLiquidity(
        bytes32 verseId,
        uint256 tokenA,
        uint256 tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant onlyActiveVerse(verseId) returns (uint256 amountA, uint256 amountB, uint256 shares) {

        
        (uint256 token0, uint256 token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        (uint256 amount0Desired, uint256 amount1Desired) = tokenA < tokenB ? (amountADesired, amountBDesired) : (amountBDesired, amountADesired);
        (uint256 amount0Min, uint256 amount1Min) = tokenA < tokenB ? (amountAMin, amountBMin) : (amountBMin, amountAMin);
        
        Pool storage pool = pools[verseId][token0][token1];
        require(pool.exists, "Pool does not exist");
        
        if (pool.totalShares == 0) {
            amountA = amount0Desired;
            amountB = amount1Desired;
            shares = _sqrt(amountA * amountB);
            require(shares > 0, "Insufficient liquidity minted");
        } else {
            uint256 amountBOptimal = (amount0Desired * pool.reserveB) / pool.reserveA;
            if (amountBOptimal <= amount1Desired) {
                require(amountBOptimal >= amount1Min, "Insufficient B amount");
                amountA = amount0Desired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = (amount1Desired * pool.reserveA) / pool.reserveB;
                require(amountAOptimal <= amount0Desired && amountAOptimal >= amount0Min, "Insufficient A amount");
                amountA = amountAOptimal;
                amountB = amount1Desired;
            }
            shares = _min((amountA * pool.totalShares) / pool.reserveA, (amountB * pool.totalShares) / pool.reserveB);
        }
        
        conditionalToken.safeTransferFrom(msg.sender, address(this), token0, amountA, "");
        conditionalToken.safeTransferFrom(msg.sender, address(this), token1, amountB, "");
        
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalShares += shares;
        pool.shares[msg.sender] += shares;
        
        emit LiquidityAdded(verseId, token0, token1, msg.sender, amountA, amountB, shares);
    }

    function removeLiquidity(
        bytes32 verseId,
        uint256 tokenA,
        uint256 tokenB,
        uint256 shares,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant onlyActiveVerse(verseId) returns (uint256 amountA, uint256 amountB) {
        (uint256 token0, uint256 token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        
        Pool storage pool = pools[verseId][token0][token1];
        require(pool.exists, "Pool does not exist");
        require(pool.shares[msg.sender] >= shares, "Insufficient shares");
        require(shares > 0, "Invalid shares amount");
        
        amountA = (shares * pool.reserveA) / pool.totalShares;
        amountB = (shares * pool.reserveB) / pool.totalShares;
        
        require(amountA >= amountAMin && amountB >= amountBMin, "Insufficient output amount");
        
        pool.shares[msg.sender] -= shares;
        pool.totalShares -= shares;
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        
        conditionalToken.safeTransferFrom(address(this), msg.sender, token0, amountA, "");
        conditionalToken.safeTransferFrom(address(this), msg.sender, token1, amountB, "");
        
        emit LiquidityRemoved(verseId, token0, token1, msg.sender, amountA, amountB, shares);
    }

    function swap(
        bytes32 verseId,
        uint256 tokenIn,
        uint256 tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) external nonReentrant onlyActiveVerse(verseId) returns (uint256 amountOut) {

        require(tokenIn != tokenOut, "Identical tokens");
        require(amountIn > 0, "Invalid input amount");
        
        (uint256 token0, uint256 token1) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        
        Pool storage pool = pools[verseId][token0][token1];
        require(pool.exists, "Pool does not exist");
        require(pool.reserveA > 0 && pool.reserveB > 0, "Insufficient liquidity");
        
        (uint256 reserveIn, uint256 reserveOut) = tokenIn == token0 ? (pool.reserveA, pool.reserveB) : (pool.reserveB, pool.reserveA);
        
        amountOut = _getAmountOut(amountIn, reserveIn, reserveOut);
        require(amountOut >= amountOutMin, "Insufficient output amount");
        
        conditionalToken.safeTransferFrom(msg.sender, address(this), tokenIn, amountIn, "");
        conditionalToken.safeTransferFrom(address(this), msg.sender, tokenOut, amountOut, "");
        
        if (tokenIn == token0) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }
        
        emit Swap(verseId, tokenIn, tokenOut, msg.sender, amountIn, amountOut);
    }

    function evaporateVerse(bytes32 verseId) external onlyOwner {
        (, , bool resolved, ) = conditionalToken.verses(verseId);
        require(resolved, "Verse not resolved");
        
        emit PoolEvaporated(verseId, 0, 0);
    }

    function getReserves(bytes32 verseId, uint256 tokenA, uint256 tokenB) external view returns (uint256 reserveA, uint256 reserveB) {
        (uint256 token0, uint256 token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        Pool storage pool = pools[verseId][token0][token1];
        return tokenA == token0 ? (pool.reserveA, pool.reserveB) : (pool.reserveB, pool.reserveA);
    }

    function getUserShares(bytes32 verseId, uint256 tokenA, uint256 tokenB, address user) external view returns (uint256) {
        (uint256 token0, uint256 token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return pools[verseId][token0][token1].shares[user];
    }

    function getAmountOut(uint256 amountIn, bytes32 verseId, uint256 tokenIn, uint256 tokenOut) external view returns (uint256) {
        (uint256 token0, uint256 token1) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        Pool storage pool = pools[verseId][token0][token1];
        (uint256 reserveIn, uint256 reserveOut) = tokenIn == token0 ? (pool.reserveA, pool.reserveB) : (pool.reserveB, pool.reserveA);
        return _getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        
        return numerator / denominator;
    }



    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 x, uint256 y) internal pure returns (uint256) {
        return x < y ? x : y;
    }
} 