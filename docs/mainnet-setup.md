# Mainnet Deployment Setup

Follow these steps in order after deploying contracts to a new network. All steps are admin calls on the deployed contracts. Complete everything before opening the app to users.

---

## Prerequisites

### Token transfer fees

The LiquidityPool, SwapManager, Loans, and CollateralManager contracts require standard ERC20/BEP20 transfer behavior — `transferFrom(from, to, amount)` must move exactly `amount`. Deposits and collateral locks are multi-hop, so any fee or burn taken mid-transfer will cause the next hop to revert.

Before enabling any token, confirm **one** of the following:
- The token has no transfer fee, **or**
- The LiquidityPool, SwapManager, Loans, and CollateralManager contracts are all on the token's fee-exempt list (both incoming and outgoing)

This matters most for reflection/SafeMoon-style tokens, which take fees by default. LMLN itself charges a 10 BPS (0.1%) transfer tax; the UI grosses up the LMLN approval to cover this, so LMLN does not need to be fee-exempt.

---

## Step 1 — Set environment variables

Add the deployed contract addresses and your WalletConnect project ID to `.env` (or Cloudflare Pages secrets — see README):

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
NEXT_PUBLIC_LEMON_LOANS_ADDRESS=0x...
NEXT_PUBLIC_LEMON_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_LEMON_COLLATERAL_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_CITRON_LOANS_ADDRESS=0x...            # testnet only
NEXT_PUBLIC_CITRON_LIQUIDITY_POOL_ADDRESS=0x...   # testnet only
NEXT_PUBLIC_CITRON_COLLATERAL_MANAGER_ADDRESS=0x...# testnet only
NEXT_PUBLIC_CITRON_SWAP_MANAGER_ADDRESS=0x...     # testnet only
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

## Step 3 — Wire the CollateralManager

The CollateralManager holds collateral for active loans. Loans and CollateralManager reference each other directly, and CollateralManager uses PriceHelper to value non-stable collateral.

```solidity
Loans.setCollateralManager(<CollateralManager address>)
CollateralManager.setLoans(<Loans address>)
CollateralManager.setPriceHelper(<PriceHelper address>)
CollateralManager.setDefaultLiquidator(<DefaultLiquidator address>)
```

**Verify:**
```solidity
CollateralManager.setLoans     // read via storage or re-read via getter if exposed
CollateralManager.setPriceHelper
// Loans → CollateralManager wiring is validated implicitly when initiateLoan succeeds in step 11.
```

Without this, `initiateLoan` will revert when trying to hand collateral to the CollateralManager.

---

## Step 4 — Grant contract roles

The Loans contract must have `MANAGER_ROLE` on the LiquidityPool so it can deposit collateral during loan creation. Without this, `initiateLoan` reverts with no error data.

```solidity
LiquidityPool.grantRole(MANAGER_ROLE, <Loans address>)
```

The CollateralManager needs a role on the Loans contract so it can call back during liquidation, and Loans needs a role on the CollateralManager so it can lock/release collateral. Grant whichever roles the contracts' `onlyRole` modifiers require (check the source).

```solidity
CollateralManager.grantRole(LOANS_ROLE, <Loans address>)
// plus any other roles the deployed contracts require between Loans ↔ CollateralManager
```

**Verify:**
```solidity
LiquidityPool.hasRole(MANAGER_ROLE, <Loans address>)
CollateralManager.hasRole(LOANS_ROLE, <Loans address>)
// Expected: true for each
```

---

## Step 5 — Configure the price feed

For every non-stable asset (any asset where `usesPriceFeed=true` in later steps), the price feed must be returning a live value before the asset is enabled.

**Verify for each non-stable asset:**
```solidity
PriceDataFeed.getSpotPrice(<token address>)
// Expected: a non-zero value in 1e8 scale
```

The price feed is configured independently of the LiquidityPool and CollateralManager. If this call returns zero or reverts, the feed must be set up before proceeding.

---

## Step 6 — Configure collateral assets (CollateralManager)

Each token that users can post as collateral must be registered on the CollateralManager. The config tuple is `(allowed, usesPriceFeed, stablePrice, decimals)`.

**For each supported collateral token** (e.g. WLEMX):

```solidity
CollateralManager.setAssetConfig(
  <token address>,
  (
    true,              // allowed
    true,              // usesPriceFeed — true for non-stables; false for stablecoins
    0,                 // stablePrice — 1e8-scaled fixed price if usesPriceFeed=false, else 0
    18                 // decimals — must match the ERC20 token's decimals()
  )
)
```

If an asset only needs to be enabled/disabled without changing the config tuple:

```solidity
CollateralManager.setAssetAllowed(<token address>, true)
```

**Verify:**
```solidity
CollateralManager.getSupportedAssets()
// Expected: array containing each configured token
CollateralManager.getAssetConfig(<token address>)
// Expected: allowed=true, correct decimals, correct price feed/stable price settings
```

The UI reads `getSupportedAssets()` and auto-selects when exactly one collateral is configured. If multiple tokens are listed here, a future selector UI will surface them; until then only the first returned address is effectively used.

---

## Step 7 — Configure interest APR tiers per asset (Loans)

Each collateral asset must have at least one APR tier defined, keyed by duration range. The UI reads these to offer APR by loan duration.

```solidity
Loans.addInterestAprConfigs(
  <collateral token address>,
  [
    { minDuration: 300,     maxDuration: 86400,   interestApr: 12000000 }, // 12%
    { minDuration: 86400,   maxDuration: 2592000, interestApr: 15000000 }, // 15%
    // …etc
  ]
)
```

`interestApr` is scaled by `aprDecimals` (read via `Loans.aprDecimals()`).

**Verify:**
```solidity
Loans.getAllInterestAprConfigs(<collateral token address>)
// Expected: the tiers you just added
```

To remove a tier:
```solidity
Loans.removeInterestAprConfig(<collateral token address>, <index>)
```

---

## Step 8 — Configure LTV / origination fee options per asset (Loans)

Each collateral asset must have at least one LTV option with its corresponding origination fee. The UI surfaces these as the LTV slider's discrete steps.

```solidity
Loans.addOriginationFees(
  <collateral token address>,
  [20000000, 30000000, 40000000, 50000000, 60000000], // LTVs scaled by ltvDecimals (20%, 30%, …)
  [<fee at 20% LTV>, <fee at 30%>, …]                 // origination fee in LMLN wei per LTV tier
)
```

`ltvDecimals` is read via `Loans.ltvDecimals()`. Fees are denominated in the origination-fee token (LMLN) in raw wei.

**Verify:**
```solidity
Loans.getAllOriginationFees(<collateral token address>)
// Expected: (ltvs[], fees[]) arrays matching what you just set
```

---

## Step 9 — Configure supported deposit assets (LiquidityPool)

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

## Step 10 — Add lock tiers

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

## Step 11 — Set the minimum deposit

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

## Step 12 — Configure native fees

The pool charges a small native token fee on `claimEarnings`, `compoundEarnings`, and `claimWithdrawal`. Set the amounts and the receiver address:

```solidity
LiquidityPool.setNativeFeeConfig(
  <depositFeeUSD>,  // USD amount (18 decimals) charged on claim/compound
  <withdrawFeeUSD>, // USD amount (18 decimals) charged on withdrawal claim
  <feeReceiver>     // address that receives collected fees
)
```

The Loans contract has an equivalent fee on `initiateLoan` and `makeLoanPayment`:

```solidity
Loans.setNativeFeeConfig(
  <initiateFeeUSD>, // USD amount (18 decimals) charged on initiateLoan
  <paymentFeeUSD>,  // USD amount (18 decimals) charged on makeLoanPayment
  <feeReceiver>     // address that receives collected fees
)
```

To disable fees entirely, pass `0` for the amounts.

**Verify:**
```solidity
LiquidityPool.depositFeeUSD()
LiquidityPool.withdrawFeeUSD()
LiquidityPool.nativeFeeReceiver()
```

---

## Step 13 — Set earnings frequency

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

Run through this before opening to users. Repeat the asset-specific rows for every supported asset.

| # | Check | How to verify | Expected result |
|---|---|---|---|
| 1 | Environment variables set | `.env` / Cloudflare secrets | All `NEXT_PUBLIC_*` vars populated, including `*_COLLATERAL_MANAGER_ADDRESS` |
| 2 | Build passes | `npm run build` | No errors |
| 3 | SwapManager wired | `LiquidityPool.swapManager()` | SwapManager address |
| 4 | CollateralManager wired | Loans/CollateralManager reference each other, PriceHelper set | Successful `initiateLoan` |
| 5 | Loans has MANAGER_ROLE | `LiquidityPool.hasRole(MANAGER_ROLE, Loans)` | `true` |
| 6 | Loans ↔ CollateralManager roles granted | `CollateralManager.hasRole(LOANS_ROLE, Loans)` | `true` |
| 7 | Price feed live | `PriceDataFeed.getSpotPrice(token)` | Non-zero (non-stable assets only) |
| 8 | Collateral asset configured | `CollateralManager.getAssetConfig(token)` | `allowed=true`, correct decimals |
| 9 | APR tiers set | `Loans.getAllInterestAprConfigs(token)` | ≥ 1 tier |
| 10 | LTV / fee options set | `Loans.getAllOriginationFees(token)` | Matching `(ltvs[], fees[])` arrays |
| 11 | Deposit asset configured | `LiquidityPool.getAssetConfig(token).status` | `1` (Active) |
| 12 | Lock tiers exist | `LiquidityPool.getAssetLockTiers(token)` | ≥ 1 enabled tier |
| 13 | Minimum deposit set | `LiquidityPool.minimumDepositValue()` | Intended value in raw units |
| 14 | Fee receiver set (pool + loans) | `LiquidityPool.nativeFeeReceiver()`, `Loans.nativeFeeReceiver()` | Correct address on both |
| 15 | Earnings frequency set | `LiquidityPool.earningsFrequency()` | Intended interval (seconds) |
| 16 | Token transfer fee | Check token contract | 0, or protocol contracts fee-exempt |
| 17 | SwapManager swap ID | `SwapManager.assetSwapIds(token)` | Non-zero bytes32 (check after first deposit) |
