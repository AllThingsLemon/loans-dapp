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

Only the Loans contract address is required per chain. The rest of the protocol addresses are discovered on-chain at app load:

- `CollateralManager` ← `Loans.collateralManager()`
- `LiquidityPool` ← `Loans.liquidityPool()`
- `SwapManager` ← `LiquidityPool.swapManager()`

Add the following to `.env` (or Cloudflare Pages secrets — see README). Provide a Loans address for every chain id you list in `NEXT_PUBLIC_SUPPORTED_CHAINS`:

```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
NEXT_PUBLIC_SUPPORTED_CHAINS=1006,56               # comma-separated chain ids; first is default
NEXT_PUBLIC_LEMON_LOANS_ADDRESS=0x...              # required when 1006 is listed
NEXT_PUBLIC_BSC_LOANS_ADDRESS=0x...                # required when 56 is listed
NEXT_PUBLIC_CITRON_LOANS_ADDRESS=0x...             # required when 1005 is listed (testnet)
```

Then rebuild so `wagmi generate` picks up the new Loans address(es):

```bash
npm run build
```

> Make sure the on-chain wiring in Steps 3 and 11 is correct before deploying — if `Loans.collateralManager()` or `Loans.liquidityPool()` return the zero address the UI cannot read anything downstream.

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

## Step 3 — Wire CollateralManager, LiquidityPool, and PriceHelper into Loans

The Loans contract holds references to the rest of the protocol. Set them all here so the on-chain `Loans.collateralManager()` / `Loans.liquidityPool()` getters return the right addresses (the dapp discovers everything else from those at runtime).

```solidity
Loans.setCollateralManager(<CollateralManager address>)
Loans.setLiquidityPool(<LiquidityPool address>)
Loans.setPriceHelper(<PriceHelper address>)
Loans.setPriceFeed(<PriceDataFeed address>)
Loans.setOriginationFeeToken(<LMLN token address>)   // skip if already set during initialize()
Loans.setNativeGasToken(<wrapped native token>)      // skip if already set during initialize()
```

The CollateralManager needs the same wiring so it can mint/release collateral and price it for liquidation:

```solidity
CollateralManager.setLoans(<Loans address>)
CollateralManager.setPriceHelper(<PriceHelper address>)
CollateralManager.setDefaultLiquidator(<DefaultLiquidator address>)
```

**Verify:**
```solidity
Loans.collateralManager()   // → CollateralManager address
Loans.liquidityPool()       // → LiquidityPool address
Loans.priceHelper()         // → PriceHelper address
Loans.priceDataFeed()       // → PriceDataFeed address
// CollateralManager's references are not exposed via public getters — they
// are validated implicitly when initiateLoan succeeds in the final smoke test.
```

Without this wiring, `initiateLoan` reverts when handing collateral to the CollateralManager or pricing it.

---

## Step 4 — Grant contract roles

Each protocol contract uses OpenZeppelin's `AccessControl` with these role constants:

- **Loans:** `DEFAULT_ADMIN_ROLE`, `MANAGER_ROLE`, `LENDER_ROLE`, `PRICE_SETTER_ROLE`, `UPGRADER_ROLE`
- **LiquidityPool:** `DEFAULT_ADMIN_ROLE`, `MANAGER_ROLE`, `MINIMUM_BYPASS_ROLE`, `UPGRADER_ROLE`
- **CollateralManager:** `DEFAULT_ADMIN_ROLE`, `MANAGER_ROLE`, `UPGRADER_ROLE`

The minimum cross-contract grants needed for a working deployment:

```solidity
// Loans must be able to deposit collateral / pull liquidity from the pool
LiquidityPool.grantRole(MANAGER_ROLE, <Loans address>)

// Loans must be able to lock/release collateral on the CollateralManager
CollateralManager.grantRole(MANAGER_ROLE, <Loans address>)

// LiquidityPool must be able to act as the lender on the Loans contract
Loans.grantRole(LENDER_ROLE, <LiquidityPool address>)

// Off-chain price keeper (the EOA / bot pushing prices to PriceDataFeed)
Loans.grantRole(PRICE_SETTER_ROLE, <price keeper address>)
```

Read the deployed source for any project-specific roles (e.g. liquidator roles) before considering this step done.

**Verify:**
```solidity
LiquidityPool.hasRole(MANAGER_ROLE, <Loans>)
CollateralManager.hasRole(MANAGER_ROLE, <Loans>)
Loans.hasRole(LENDER_ROLE, <LiquidityPool>)
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

## Step 6 — Configure global Loans parameters

These globals apply to every loan regardless of collateral and back the constants the dapp reads at app load (the loan calculator's min/max amount, slider bounds, and grace period).

```solidity
Loans.setLoanConfiguration(
  <minLoanAmount>,                // raw stable-token wei
  <minLoanDuration>,              // seconds
  <maxLoanDuration>,              // seconds
  <balloonPaymentGraceDuration>,  // seconds — grace after loan end before default
  <loanCycleDuration>,            // seconds per cycle (drives interest cadence)
  <aprYearDuration>               // seconds in a year (e.g. 31536000); APR scales by this
)

Loans.setMaxLoanAmount(<absolute ceiling, raw stable-token wei>)
Loans.setWithdrawalReserve(<reserve amount, raw stable-token wei>)   // optional
```

**Verify:**
```solidity
Loans.loanConfig()        // → tuple matching the values you just set
Loans.maxLoanAmount()     // → ceiling
Loans.withdrawalReserve() // → reserve
```

If `loanConfig()` returns zeros, the dapp's calculator is unusable — `minLoanAmount` and `loanCycleDuration` drive the form defaults and the on-screen countdown.

---

## Step 7 — Configure origination-fee distribution

```solidity
Loans.setOriginationFeeReceiver(<receiver address>)        // required: where origination fees go
Loans.setOriginationFeeSplit(<burnBps>, <donationBps>)     // optional: portions burnt / donated
```

`burnBps + donationBps` must be ≤ `10_000` (= 100%). Any remainder stays with the receiver.

**Verify:**
```solidity
Loans.originationFeeReceiver()
Loans.originationFeeSplit()
```

---

## Step 8 — Configure collateral assets (CollateralManager)

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

## Step 9 — Configure interest APR tiers per asset (Loans)

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

## Step 10 — Configure LTV / origination fee options per asset (Loans)

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

## Step 11 — Configure supported deposit assets (LiquidityPool)

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

## Step 12 — Add lock tiers

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

## Step 13 — Set the minimum deposit

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

## Step 14 — Configure native fees

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

## Step 15 — Set earnings frequency

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
| 1 | Environment variables set | `.env` / Cloudflare secrets | `NEXT_PUBLIC_*_LOANS_ADDRESS` populated for every chain id in `NEXT_PUBLIC_SUPPORTED_CHAINS`; nothing else needed (other addresses are read from chain) |
| 2 | Build passes | `npm run build` | No errors |
| 3 | SwapManager wired | `LiquidityPool.swapManager()` | SwapManager address |
| 4 | Loans wired (CM, LP, PriceHelper, PriceFeed) | `Loans.collateralManager()`, `Loans.liquidityPool()`, `Loans.priceHelper()`, `Loans.priceDataFeed()` | All four return non-zero addresses |
| 5 | Loans has `MANAGER_ROLE` on LP and CM | `LiquidityPool.hasRole(MANAGER_ROLE, Loans)`, `CollateralManager.hasRole(MANAGER_ROLE, Loans)` | `true` for both |
| 6 | LiquidityPool has `LENDER_ROLE` on Loans | `Loans.hasRole(LENDER_ROLE, LiquidityPool)` | `true` |
| 7 | Price feed live | `PriceDataFeed.getSpotPrice(token)` | Non-zero, recent timestamp (non-stable assets only) |
| 8 | Loan globals set | `Loans.loanConfig()`, `Loans.maxLoanAmount()` | Matching the values you configured |
| 9 | Origination-fee receiver set | `Loans.originationFeeReceiver()` | Non-zero address |
| 10 | Collateral asset configured | `CollateralManager.getAssetConfig(token)` | `allowed=true`, correct decimals |
| 11 | APR tiers set | `Loans.getAllInterestAprConfigs(token)` | ≥ 1 tier |
| 12 | LTV / fee options set | `Loans.getAllOriginationFees(token)` | Matching `(ltvs[], fees[])` arrays |
| 13 | Deposit asset configured | `LiquidityPool.getAssetConfig(token).status` | `1` (Active) — or `2` for collateral-only assets like LMLN |
| 14 | Lock tiers exist | `LiquidityPool.getAssetLockTiers(token)` | ≥ 1 enabled tier |
| 15 | Minimum deposit set | `LiquidityPool.minimumDepositValue()` | Intended value in raw units |
| 16 | Native fees set (pool + loans) | `LiquidityPool.nativeFeeReceiver()`, `Loans.nativeFeeReceiver()` | Correct address on both |
| 17 | Earnings frequency set | `LiquidityPool.earningsFrequency()` | Intended interval (seconds) |
| 18 | Token transfer fee | Check token contract | 0, or protocol contracts fee-exempt |
| 19 | SwapManager swap ID | `SwapManager.assetSwapIds(token)` (via explorer — proxy) | Non-zero bytes32 (check after first deposit) |
