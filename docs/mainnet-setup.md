# Mainnet Deployment Setup

Post-deploy configuration required before the dapp is usable on a new network
(or a new contract redeploy). Each step is an admin action on the deployed
contracts. Complete these in order before opening the app to users.

---

## 0. Token prerequisite: no fee-on-transfer

The LiquidityPool, SwapManager, and Loans contracts assume standard ERC20/BEP20
semantics: `transferFrom(from, to, amount)` moves exactly `amount`. Deposits are
multi-hop — the pool pulls tokens from the user then forwards them to the
SwapManager — so any fee or burn taken mid-flow leaves the pool short, reverting
with a balance error.

For every token configured on the pool, one of the following must be true:

- The token has **no transfer fee**, **or**
- The token supports a fee-exempt list, and the **LiquidityPool, SwapManager,
  and Loans contracts are all excluded from both incoming and outgoing fees**.

Confirm this before enabling any asset in step 3. This is especially important
for tokens that inherit from reflection/SafeMoon-style bases.

---

## 1. Wire environment variables

Populate `.env` (or Cloudflare Pages secrets — see README) with deployed
contract addresses for the target chain:

```
NEXT_PUBLIC_LEMON_LOANS_ADDRESS=0x...
NEXT_PUBLIC_LEMON_LIQUIDITY_POOL_ADDRESS=0x...
NEXT_PUBLIC_CITRON_LOANS_ADDRESS=0x...          # testnet only
NEXT_PUBLIC_CITRON_LIQUIDITY_POOL_ADDRESS=0x... # testnet only
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
```

Then run a build so `wagmi generate` picks up the new addresses:

```bash
npm run build
```

---

## 2. LiquidityPool: point at the live SwapManager

```solidity
LiquidityPool.setSwapManager(<SwapManager address>)
```

Verify:

```solidity
LiquidityPool.swapManager() // must return the SwapManager address
```

Without this the pool cannot route non-stable deposits through the DCA sell-off path.

---

## 3. LiquidityPool: configure each supported asset

The `AssetStatus` enum controls whether an asset is available:
- `0` = Disabled — not usable
- `1` = Active — user-depositable
- `2` = InternalOnly — collateral-only, never user-depositable (e.g. LMLN as loan collateral)

For each asset users should be able to deposit (e.g. LUSD, WLEMX):

```solidity
LiquidityPool.setAssetConfig(
  token,
  1,              // AssetStatus.Active
  usesPriceFeed,  // true for non-stable assets priced via the feed; false for stablecoins
  stablePrice     // 1e8-scaled fixed price if usesPriceFeed=false, or 0 if usesPriceFeed=true
)
```

For assets that should only be reachable through internal protocol flows (e.g. LMLN deposited as loan collateral — never by a user directly):

```solidity
LiquidityPool.setAssetConfig(token, 2, usesPriceFeed, stablePrice) // AssetStatus.InternalOnly
```

To update just the status of an already-configured asset:

```solidity
LiquidityPool.setAssetStatus(token, <AssetStatus>)
```

Then add at least one lock tier per user-depositable asset:

```solidity
LiquidityPool.addAssetLockTier(
  token,
  durationSeconds,        // e.g. 2592000 for 30 days
  interestMultiplierBps   // e.g. 10000 = 1× (base rate), 15000 = 1.5×
)
```

Verify:

```solidity
LiquidityPool.getAssetConfig(token)    // status must be 1 (Active) for user-depositable assets
LiquidityPool.getAssetLockTiers(token) // must return at least one enabled tier
```

---

## 4. SwapManager swap IDs — no action required

`SwapManager.setupAssetSwap(token)` is guarded by `onlyLiquidityPool` — no EOA,
not even a `DEFAULT_ADMIN_ROLE` holder, can call it directly.

The protocol creates `assetSwapIds[token]` lazily the first time the pool needs
to route that token through the SwapManager:

- User-depositable non-stable assets: bootstrapped by the first `deposit(token, …)` call.
- Collateral-only assets: bootstrapped by the first liquidation-surplus flow.

The very first depositor of each asset pays slightly more gas for the setup.
Nothing to configure at deploy time.

Verify after the first deposit:

```solidity
SwapManager.assetSwapIds(token) // must be non-zero bytes32
```

---

## 5. LiquidityPool: minimum deposit value

```solidity
LiquidityPool.setMinimumDeposit(<amount in stable token raw units>)
// Example: for a $10 minimum with an 18-decimal stable token:
LiquidityPool.setMinimumDeposit(10000000000000000000)
```

The frontend reads this live via `minimumDepositValue()` and enforces it before
submitting. Note: this minimum applies to user deposits only. Internal collateral
deposits made by the Loans contract should be exempt by design — verify this in
the contract source if unexpected `BelowMinimumDeposit` errors appear on loan
creation.

---

## 6. LiquidityPool: native fee configuration

The pool charges a small native token fee on `claimEarnings`, `compoundEarnings`,
and `claimWithdrawal` to cover operational costs:

```solidity
LiquidityPool.setNativeFeeConfig(
  depositFeeUSD,   // fee in USD (scaled to 18 decimals) charged on claim/compound
  withdrawFeeUSD,  // fee in USD (scaled to 18 decimals) charged on withdrawal claim
  feeReceiver      // address that receives the native fee
)
```

To disable fees, set both amounts to `0`. Verify:

```solidity
LiquidityPool.depositFeeUSD()
LiquidityPool.withdrawFeeUSD()
LiquidityPool.nativeFeeReceiver()
```

---

## 7. Role wiring between contracts

The LiquidityPool and Loans contracts call into each other and require specific
roles:

```solidity
// Loans needs MANAGER_ROLE on the pool so the loan flow can call back
// into the pool (e.g. to deposit collateral). Without this, loan creation
// reverts with no error data.
LiquidityPool.grantRole(MANAGER_ROLE, <Loans address>)
```

Verify:

```solidity
LiquidityPool.hasRole(MANAGER_ROLE, <Loans address>) // must be true
```

> Check the Loans contract source for any additional roles required between the
> two contracts and grant them before opening to users.

---

## 8. Price feed sanity check

For each asset with `usesPriceFeed=true`, confirm the feed returns a live price
before enabling the asset:

```solidity
PriceDataFeed.getSpotPrice(token) // must be > 0, denominated in 1e8
```

The price feed is configured independently of the LiquidityPool. Ensure the feed
is updated for every non-stable asset before its first deposit.

---

## 9. Earnings frequency

Set how often the pool allows earnings to be pulled from the Loans contract:

```solidity
LiquidityPool.setEarningsFrequency(intervalSeconds)
// Example: 86400 = once per day
```

Verify:

```solidity
LiquidityPool.earningsFrequency()
```

---

## Quick verification checklist

Run these read calls before going live. All must pass for the pool to accept
deposits and for loans to function correctly.

| Check | Call | Expected |
|---|---|---|
| Token transfer fee | Manual check or token contract | 0, or protocol contracts exempt |
| SwapManager wired | `LiquidityPool.swapManager()` | Live SwapManager address |
| Asset active | `LiquidityPool.getAssetConfig(token).status` | `1` (Active) |
| Lock tiers exist | `LiquidityPool.getAssetLockTiers(token)` | ≥ 1 enabled tier |
| Loans has MANAGER_ROLE | `LiquidityPool.hasRole(MANAGER_ROLE, Loans)` | `true` |
| Price feed live | `PriceDataFeed.getSpotPrice(token)` | Non-zero (feed-priced assets only) |
| Minimum deposit set | `LiquidityPool.minimumDepositValue()` | Intended value in raw stable units |
| Native fee receiver | `LiquidityPool.nativeFeeReceiver()` | Correct receiver address |
| Earnings frequency | `LiquidityPool.earningsFrequency()` | Intended interval in seconds |
| Swap ID created | `SwapManager.assetSwapIds(token)` | Non-zero bytes32 (after first deposit) |

If all rows pass for every supported asset, the Add Liquidity UI will accept
deposits and loan creation will succeed.
