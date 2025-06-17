# Multiverse Finance

Event-Conditional Universal Basic Income Platform

## Project Structure

This is a monorepo using Turborepo with the following structure:

- `apps/frontend` - Next.js frontend application
- `apps/contracts` - Hardhat smart contracts
- `packages/wagmi-db` - RainbowKit/Wagmi authentication and database integration
- `packages/sdk` - TypeScript SDK for contract and backend interaction
- `packages/ui` - Shared UI components with shadcn/ui

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development servers:
```bash
npm run dev
```

3. Build all packages:
```bash
npm run build
```

## Development Commands

- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run test` - Run tests
- `npm run clean` - Clean build artifacts

## Progress

### ✅ Project Setup Complete
- ✅ Monorepo with Turborepo  
- ✅ Next.js frontend app  
- ✅ Hardhat contracts project  
- ✅ RainbowKit/Wagmi integration  
- ✅ TypeScript SDK  
- ✅ Shared UI library with shadcn/ui

### ✅ Smart Contracts  
- ✅ **ConditionalToken (ERC-1155)** - Core multiverse finance contract
  - Implements verse creation and partitioning
  - Split/combine ownership mechanics (parent ↔ children)
  - Event resolution and verse evaporation
  - **Deployed locally** with mint/burn functionality tested
  - **Fixed**: Added VerseEvaporated events for off-chain indexing
  - **Note**: Partition validation and oracle integration planned for later tasks

- ✅ **MultiverseAMM** - Verse-scoped Automated Market Maker
  - Constant product AMM (x * y = k) with 0.3% fee
  - Verse-isolated liquidity pools prevent cross-verse contamination
  - Add/remove liquidity with LP share tokens
  - Swap functionality within verse boundaries
  - **Deployed locally** with pool creation and basic operations tested
  - Automatic pool evaporation when verses resolve
  - Integrates with ConditionalToken for verse validation

### Current Status
The ConditionalToken contract implements the core [Multiverse Finance](https://www.paradigm.xyz/2025/05/multiverse-finance) mechanics:

**Verse Management**: Create parallel universes for different event outcomes  
**Ownership Splitting**: Push ownership from parent verse to child verses  
**Ownership Combining**: Pull ownership from child verses back to parent  
**Event Resolution**: Resolve outcomes and evaporate losing verses

Test the contracts:
```bash
cd apps/contracts
npm test                              # Run unit tests
npx hardhat run scripts/deploy.ts     # Deploy ConditionalToken with example
npx hardhat run scripts/deploy-amm.ts # Deploy both contracts  
npx hardhat run scripts/test-amm.ts   # Test AMM functionality
npx hardhat run scripts/test-interactions.ts  # Interactive demo
``` 