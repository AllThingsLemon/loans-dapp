# Mainnet Deployment Setup

Follow these steps in order after deploying contracts to a new network. All steps are admin calls on the deployed contracts. Complete everything before opening the app to users.

---

## Prerequisites

### Token transfer fees

The LiquidityPool, SwapManager, and Loans contracts require standard ERC20/BEP20 transfer behavior — `transferFrom(from, to, amount)` must move exactly `amount`. Deposits are multi-hop, so any fee or burn taken mid-transfer will cause the next hop to revert.

Before enabling any token, confirm **one** of the following:
- The token has no transfer fee, **or**
- The LiquidityPool, SwapManager, and Loans contracts are all on the token's fee-exempt list (both incoming and outgoing)

This matters most for reflection/SafeMoon-style tokens, which take fees by default.

---

## Step 1 — Set environment variables

Add the deployed contract addresses and your WalletConnect project ID to `.env` (or Cloudflare Pages secrets — see README):

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
NEXT_PUBLIC_LEMON_LOANS_ADDRESS=0x...
NEXT_PUBLIC_LEMON_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_CITRON_LOANS_ADDRESS=0x...           # testnet only
NEXT_PUBLIC_CITRON_LIQUIDITY_POOL_ADDRESS=0x...  # testnet only
```

Then rebuild so `wagmi generate` picks up the new addresses:

```bash
npm run build
```

---

## Step 2 — Wire the SwapManager

```solidity
LiquidityPool.setSwapManager(<SwapManager address>)
```

**Verify:**
```solidity
LiquidityPool.swapManager()
// Expected: the SwapManager address you just deployed
```

The pool cannot route non-stable deposits without this.

---

## Step 3 — Grant contract roles

The Loans contract must have `MANAGER_ROLE` on the LiquidityPool so it can deposit collateral during loan creation. Without this, `inititateLoan` reverts with no error data.

```solidity
LiquidityPool.grantRole(MANAGER_ROLE, <Loans address>)
```

**Verify:**
```solidity
LiquidityPool.hasRole(MANAGER_ROLE, <Loans address>)
// Expected: true
```

> Check the Loans contract source for any additional roles required between the two contracts and grant them before this step is considered complete.

---

## Step 4 — Configure the price feed

For every non-stable asset (any asset where `usesPriceFeed=true` in step 5), the price feed must be returning a live value before the asset is enabled.

**Verify for each non-stable asset:**
```solidity
PriceDataFeed.getSpotPrice(<token address>)
// Expected: a non-zero value in 1e8 scale
```

The price feed is configured independently of the LiquidityPool. If this call returns zero or reverts, the feed must be set up before proceeding.

---

## Step 5 — Configure supported assets

The `AssetStatus` enum:
- `0` — Disabled
- `1` — Active (user-depositable)
- `2` — InternalOnly (collateral-only, never shown in the deposit UI — e.g. LMLN)

**For each user-depositable asset** (e.g. LUSD, WLEMX):

```solidity
LiquidityPool.setAssetConfig(
  <token address>,
  1,              // AssetStatus.Active
  <usesPriceFeed>,// true for non-stables; false for stablecoins
  <stablePrice>   // 1e8-scaled fixed price if usesPriceFeed=false, otherwise 0
)
```

**For collateral-only assets** (e.g. LMLN — deposited internally by the Loans contract, not by users):

```solidity
LiquidityPool.setAssetConfig(<token address>, 2, <usesPriceFeed>, <stablePrice>)
```

**To change just the status of an already-configured asset:**

```solidity
LiquidityPool.setAssetStatus(<token address>, <AssetStatus>)
```

**Verify for each asset:**
```solidity
LiquidityPool.getAssetConfig(<token address>)
// Expected: status = 1 for user-depositable assets
```

---

## Step 6 — Add lock tiers

Each user-depositable asset must have at least one lock tier before the deposit UI will show it.

```solidity
LiquidityPool.addAssetLockTier(
  <token address>,
  <durationSeconds>,       // e.g. 1800 = 30 min, 2592000 = 30 days
  <interestMultiplierBps>  // e.g. 10000 = 1× base rate, 15000 = 1.5×
)
```

Call once per tier per asset. Repeat for every lock duration you want to offer.

**Verify:**
```solidity
LiquidityPool.getAssetLockTiers(<token address>)
// Expected: array with at least one entry where isEnabled = true
```

---

## Step 7 — Set the minimum deposit

```solidity
LiquidityPool.setMinimumDeposit(<amount in raw stable token units>)
```

Example — $10 minimum with an 18-decimal stable token:
```solidity
LiquidityPool.setMinimumDeposit(10000000000000000000)
```

The frontend reads this value live and enforces it before submitting. Users cannot deposit below this amount from the UI.

**Verify:**
```solidity
LiquidityPool.minimumDepositValue()
// Expected: the value you just set
```

---

## Step 8 — Configure native fees

The pool charges a small native token fee on `claimEarnings`, `compoundEarnings`, and `claimWithdrawal`. Set the amounts and the receiver address:

```solidity
LiquidityPool.setNativeFeeConfig(
  <depositFeeUSD>,  // USD amount (18 decimals) charged on claim/compound
  <withdrawFeeUSD>, // USD amount (18 decimals) charged on withdrawal claim
  <feeReceiver>     // address that receives collected fees
)
```

To disable fees entirely, pass `0` for both amounts.

**Verify:**
```solidity
LiquidityPool.depositFeeUSD()
LiquidityPool.withdrawFeeUSD()
LiquidityPool.nativeFeeReceiver()
```

---

## Step 9 — Set earnings frequency

Controls how often the pool allows earnings to be pulled from the Loans contract:

```solidity
LiquidityPool.setEarningsFrequency(<intervalSeconds>)
// Example: 86400 = once per day
```

**Verify:**
```solidity
LiquidityPool.earningsFrequency()
// Expected: the interval you just set
```

---

## Final checklist

Run through this before opening to users. Repeat for every supported asset.

| # | Check | How to verify | Expected result |
|---|---|---|---|
| 1 | Environment variables set | `.env` / Cloudflare secrets | All `NEXT_PUBLIC_*` vars populated |
| 2 | Build passes | `npm run build` | No errors |
| 3 | SwapManager wired | `LiquidityPool.swapManager()` | SwapManager address |
| 4 | Loans has MANAGER_ROLE | `LiquidityPool.hasRole(MANAGER_ROLE, Loans)` | `true` |
| 5 | Price feed live | `PriceDataFeed.getSpotPrice(token)` | Non-zero (non-stable assets only) |
| 6 | Asset configured | `LiquidityPool.getAssetConfig(token).status` | `1` (Active) |
| 7 | Lock tiers exist | `LiquidityPool.getAssetLockTiers(token)` | ≥ 1 enabled tier |
| 8 | Minimum deposit set | `LiquidityPool.minimumDepositValue()` | Intended value in raw units |
| 9 | Fee receiver set | `LiquidityPool.nativeFeeReceiver()` | Correct address |
| 10 | Earnings frequency set | `LiquidityPool.earningsFrequency()` | Intended interval (seconds) |
| 11 | Token transfer fee | Check token contract | 0, or protocol contracts fee-exempt |
| 12 | SwapManager swap ID | `SwapManager.assetSwapIds(token)` | Non-zero bytes32 (check after first deposit) |
