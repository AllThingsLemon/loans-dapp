# Mainnet Deployment Setup

Post-deploy configuration required before the dapp is usable on a new network
(or a new contract redeploy). Each step is an admin action on the deployed
contracts. Ticking these off in order should get a fresh deployment to the
point where a normal user can make a deposit.

---

## 0. Token prerequisite: no fee-on-transfer

The LiquidityPool, SwapManager, and Loans contracts all assume standard
ERC20 / BEP20 semantics: `transferFrom(from, to, amount)` moves exactly
`amount` from `from` to `to`. A deposit is a multi-hop flow — the pool pulls
tokens from the user, then forwards them to the SwapManager — and any fee /
burn / reflection taken mid-flow leaves the pool short on the forward hop,
reverting with `"BEP20: transfer amount + fees exceeds balance"` or similar.

For every token configured on the pool (stable and non-stable), one of the
following must be true:

- The token has **no transfer fee** (vanilla ERC20 / BEP20), **or**
- The token supports a fee-exempt list, and the **LiquidityPool, SwapManager,
  and Loans contracts are all excluded from both incoming and outgoing fees**.

Confirm before enabling an asset in step 3. This is particularly important for
tokens that inherit from reflection / SafeMoon-style bases — those take fees
by default and must be explicitly configured to exempt the protocol contracts.

## 1. Wire environment variables

Populate these `NEXT_PUBLIC_*` vars (in `.env` / hosting provider config) with
the deployed contract addresses for the target chain:

- `NEXT_PUBLIC_LEMON_LOANS_ADDRESS`
- `NEXT_PUBLIC_LEMON_LIQUIDITY_POOL_ADDRESS`
- `NEXT_PUBLIC_LEMON_SWAP_MANAGER_ADDRESS`
- `NEXT_PUBLIC_CITRON_*` equivalents for the testnet pair

Then regenerate wagmi bindings so the per-chain address maps include the new
deployment:

```sh
npx wagmi generate
```

## 2. LiquidityPool: point at the live SwapManager

```solidity
LiquidityPool.setSwapManager(<SwapManager address>)
```

Verify with `LiquidityPool.swapManager()` — it must return the SwapManager you
just deployed. Without this, the pool cannot route non-stable deposits through
the DCA sell-off path.

## 3. LiquidityPool: configure each supported asset

For every asset users should be able to deposit (LUSD, WLEMX, LMLN, etc.):

```solidity
LiquidityPool.setAssetConfig(
  token,
  usesPriceFeed,   // true for non-stable assets priced via the feed
  stablePrice,     // 1e8-scaled stable price, or 0 when usesPriceFeed=true
  isInternalOnly   // true = collateral-only, NOT user-depositable
)
LiquidityPool.setAssetEnabled(token, true)
```

Then add at least one lock tier:

```solidity
LiquidityPool.addAssetLockTier(token, durationSeconds, interestMultiplierBps)
```

Confirm via `getAssetConfig(token)` — `isEnabled` must be `true` and
`isInternalOnly` `false` for the UI to show it in the Add Liquidity selector.

Assets that should only be reachable through internal pool flows (e.g. as
liquidation collateral, never as a user deposit) must stay `isEnabled=false,
isInternalOnly=true`. The Add Liquidity selector filters these out.

## 4. SwapManager swap IDs — no action required

`SwapManager.setupAssetSwap(token)` is guarded by `onlyLiquidityPool` — no EOA,
not even a `DEFAULT_ADMIN_ROLE` holder, can call it directly. Attempting to
will revert with `OnlyLiquidityPool()` (selector `0xfeb42204`).

The protocol creates `assetSwapIds[token]` **lazily** the first time the
LiquidityPool needs to route that token through the SwapManager:

- User-depositable non-stable assets (e.g. WLEMX, LMLN): bootstrapped by the
  first `LiquidityPool.deposit(token, …)` call.
- Collateral only seen via liquidations: bootstrapped by the first
  liquidation-surplus flow that sends the token into the pool.

The very first depositor of each asset pays slightly more gas to cover the
setup. Nothing to do at deploy time.

Verify after the first deposit with `SwapManager.assetSwapIds(token)` — it
should return a non-zero `bytes32` and the `AssetSwapCreated(token, swapId)`
event should be in the tx logs.

## 5. LiquidityPool: minimum deposit value

```solidity
LiquidityPool.setMinimumDeposit(<amount in stable token units>)
```

The frontend reads this live via `minimumDepositValue()` and enforces it before
submitting. Pick a value that makes on-chain gas economics sensible for the
target network.

## 6. Role wiring between contracts

The LiquidityPool and Loans contracts call into each other and require
specific roles to be granted:

```solidity
// Pool needs LENDER_ROLE on Loans so it can deposit/withdraw liquidity
Loans.grantRole(LENDER_ROLE, <LiquidityPool address>)

// Loans needs MANAGER_ROLE on Pool so the deposit flow can call back
// into the Pool (e.g. to confirm deposits). Without this, deposits
// revert silently with a bare "execution reverted" (no error data).
LiquidityPool.grantRole(MANAGER_ROLE, <Loans address>)
```

Verify:

```solidity
Loans.hasRole(LENDER_ROLE, <LiquidityPool address>)   // must be true
LiquidityPool.hasRole(MANAGER_ROLE, <Loans address>)   // must be true
```

## 7. Price feed sanity check

For each asset with `usesPriceFeed=true`, confirm the feed actually returns a
price:

```solidity
PriceDataFeed.getSpotPrice(token)  // must be > 0 and in 1e8 scale
```

No setter on the LiquidityPool controls this — it's on the feed contract, so
the feed must be configured for every depositable non-stable asset before that
asset is enabled.

---

## Quick verification checklist

Once the steps above are done, run these read calls and confirm the results
for each non-stable asset the pool supports:

| Call                                       | Expected                    |
| ------------------------------------------ | --------------------------- |
| Token transfer fee                         | 0, or protocol contracts exempt |
| `LiquidityPool.swapManager()`              | live SwapManager address    |
| `LiquidityPool.getAssetConfig(token)`      | `isEnabled=true`            |
| `LiquidityPool.getAssetLockTiers(token)`   | at least one enabled tier   |
| `Loans.hasRole(LENDER_ROLE, Pool)`         | `true`                      |
| `Pool.hasRole(MANAGER_ROLE, Loans)`        | `true`                      |
| `SwapManager.assetSwapIds(token)`          | non-zero after first deposit |
| `PriceDataFeed.getSpotPrice(token)`        | non-zero (for feed-priced)  |
| `LiquidityPool.minimumDepositValue()`      | intended minimum            |

If all rows pass for an asset, the Add Liquidity UI will allow deposits of it.
