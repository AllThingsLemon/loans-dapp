# Mobile Wallet QA Test Plan — Loans & Liquidity Contracts

High-level test list for a third-party team building loan and liquidity features into a mobile wallet. It enumerates every contract function a complete user interface must exercise, organized as user flows a QA person can run top to bottom. Contract ABIs live in `src/abis/` (Loans.json, LiquidityPool.json, CollateralManager.json, ReferralDepositRouter.json).

## 0. Environment & ground rules

- **Chains:** BSC mainnet (56) and BSC testnet (97). Testnet was redeployed 2026-08-31.
- **Contracts:** `Loans`, `LiquidityPool`, `ReferralDepositRouter` are the user-facing surface. `CollateralManager` is called internally by Loans but is the **spender for collateral approvals** and the source of supported-collateral reads. All are UUPS proxies — always call through the proxy address.
- **ABI caution:** the mainnet contracts have been upgraded many times. Use the ABIs shipped in this repo, not ABIs scraped from an explorer, and prefer the aggregate view functions (`getPoolStatus`, `getLiquidityStatus`, `getUserStatus`) over raw storage getters — some raw getters are stale on the deployed version.
- **Tokens:** LUSD (the loan/stable token — what is borrowed, repaid, and what LP value is denominated in), LMLN (origination fee token), collateral assets from `CollateralManager.getSupportedAssets()` (e.g. WLEMX), and native BNB for gas.
- **Approval spenders:** collateral token → CollateralManager; LMLN origination fee → LiquidityPool; LUSD loan payments → Loans; LP deposit tokens → LiquidityPool; referral deposits → ReferralDepositRouter. (Our web app adds a ~10% buffer on the LMLN fee approval so `transferFrom` never comes up short.)
- **Simulate first:** run `eth_call`/gas estimation with the full ABI before every wallet prompt so custom errors are decoded and shown to the user instead of a post-gas revert.
- **Loan status enum:** 0 COMPLETED (paid, collateral withdrawn) · 1 UNLOCKED (paid, collateral withdrawable) · 2 DEFAULT · 3 ACTIVE · 4 LIQUIDATED.

## 1. Loan quoting & configuration (read-only)

| ID | Test | Functions | Expected |
|----|------|-----------|----------|
| Q-01 | Display global loan limits | `Loans.loanConfig`, `maxLoanAmount` | Min/max amount and min/max duration shown; UI blocks out-of-range input |
| Q-02 | Show available borrowing liquidity | `Loans.availablePrincipal`, `getLiquidityStatus` | Loan amount capped at available principal |
| Q-03 | APR by duration | `getInterestApr(asset, duration)`, `getAllInterestAprConfigs(asset)` | APR updates as duration slider moves; matches config table; format with `aprDecimals` |
| Q-04 | Origination fee by LTV | `getAllOriginationFeePcts(asset)` | Fee tiers shown per LTV option; format with `ltvDecimals` |
| Q-05 | Full quote | `calculateLoanDetails(asset, duration, amount, ltv)` | Interest, APR, origination fee, collateral required, cycle duration, first payment all match on-chain values exactly |
| Q-06 | Collateral requirement | `CollateralManager.getRequiredCollateral`, `getCollateralValue`, `getSupportedAssets`, `isAssetAllowed` | Collateral amount and USD value correct per asset; only allowed assets offered |

## 2. Loan creation

| ID | Test | Functions | Expected |
|----|------|-----------|----------|
| C-01 | Fresh-wallet approval flow | ERC-20 `approve` ×2 | Collateral approved to CollateralManager, LMLN to LiquidityPool; steps skip correctly when allowance already sufficient |
| C-02 | Happy path | `initiateLoan(asset, duration, amount, ltv, originationPayer)` | Returns `loanId`; loan appears via `getAccountLoanIds`; collateral and LMLN debited; LUSD credited |
| C-03 | Verify stored terms | `loans(loanId)`, `loanStatus(loanId)` | Stored amount/duration/LTV/interest/collateral match the quote; status = ACTIVE (3) |
| C-04 | Below min / above max amount | `initiateLoan` | Reverts; UI blocks before wallet prompt |
| C-05 | Unsupported duration or LTV | `initiateLoan` | Reverts (no APR config / no fee tier); UI never offers these |
| C-06 | Insufficient pool liquidity | `initiateLoan` with amount > `availablePrincipal` | Reverts; clear message |
| C-07 | Delegated fee payer | `setOriginationDelegate(borrower, true)` by payer, then `initiateLoan(..., originationPayer)` | Delegate's LMLN debited; non-delegated payer reverts |
| C-08 | Insufficient balances | collateral / LMLN short | Each shortfall caught pre-prompt with a specific message |
| C-09 | Paused contract | `paused()` | Writes revert; UI shows maintenance state |

## 3. Active loan display & payments

| ID | Test | Functions | Expected |
|----|------|-----------|----------|
| P-01 | Loan list with pagination | `getAccountLoanIds(account, offset, limit)` | All loans listed; pagination works past the limit |
| P-02 | Cycle & schedule display | `transpiredCycles`, `remainingCycles`, `fullCyclesAhead`, `elapsedTimeInCycle`, `remainingTimeInCycle`, `totalNumberOfPayments` | Brand-new loan shows 0/N transpired; counters advance with time |
| P-03 | Default countdown | `timeToDefault(loanId)` | Positive countdown on a healthy loan; shrinks when a payment cycle lapses |
| P-04 | Minimum payment | `loanPayment(loanId)` | Amount due shown correctly (tiny loans may round to cents) |
| P-05 | Make a payment | ERC-20 `approve` (LUSD → Loans), `makeLoanPayment(loanId, amount)` | `paidAmount` increments; remaining balance and cycle counters update |
| P-06 | Multi-cycle prepayment | `makeLoanPayment` with several cycles' worth | `fullCyclesAhead` increases; `timeToDefault` extends |
| P-07 | Final/balloon payment | `makeLoanPayment` for full remaining balance | Status flips to UNLOCKED (1); balloon grace period respected |
| P-08 | Payment reverts | zero amount, wrong loanId, not-your-loan | Each reverts with decoded error before/at prompt |

## 4. Loan extension

| ID | Test | Functions | Expected |
|----|------|-----------|----------|
| E-01 | Extend an active loan | `extendLoan(loanId, extendTime, originationPayer)` | Duration extends; a new origination fee is charged in LMLN; new terms reflected in `loans(loanId)` |
| E-02 | Extension quote | `calculateLoanDetails` / fee tiers | Fee for the extension shown before confirming |
| E-03 | Extension limits | `extendLoan` past `maxLoanDuration` or on non-ACTIVE loan | Reverts |
| E-04 | Delegated extension fee | `originationPayer` ≠ borrower | Same delegation rules as C-07 |

## 5. Payoff, collateral & default states

| ID | Test | Functions | Expected |
|----|------|-----------|----------|
| D-01 | Withdraw collateral | `withdrawCollateral(loanId)` on UNLOCKED loan | Collateral returned in full; status → COMPLETED (0) |
| D-02 | Premature withdrawal | `withdrawCollateral` on ACTIVE loan | Reverts |
| D-03 | Defaulted loan display | let `timeToDefault` hit 0; keeper runs `processDefaults` | Status → DEFAULT/LIQUIDATED; UI shows terminal state, hides payment/withdraw actions |
| D-04 | Historical loans | `loans(loanId)` for COMPLETED/LIQUIDATED | History renders with final paid amounts |

## 6. Liquidity discovery (read-only)

| ID | Test | Functions | Expected |
|----|------|-----------|----------|
| LD-01 | Supported deposit assets | `LiquidityPool.getSupportedAssets`, `getAssetConfig` | Only active assets offered; per-asset config respected |
| LD-02 | Lock tiers & multipliers | `getAssetLockTiers(token)`, `getMaxLockDuration(token)` | Tier durations and interest multipliers displayed; disabled tiers hidden |
| LD-03 | Pool overview | `getPoolStatus`, `getShareValue`, `getCurrentUtilization`, `getLiquidityStatus` (Loans) | TVL, share value, utilization, interest earned/distributed all render |
| LD-04 | Deposit preview | `getDepositCredit(token, amount)`, `getTokensForStableValue` | Credited stable value shown before deposit, incl. non-stable assets |
| LD-05 | Minimums & caps | `minimumDepositValue`, `minimumWithdrawalValue`, `getAcceptableLiquidityAmount` | UI enforces before prompting |

## 7. Deposits

| ID | Test | Functions | Expected |
|----|------|-----------|----------|
| L-01 | Stable-token deposit | `approve` (→ LiquidityPool), `deposit(token, amount, lockDuration, nonEarning)` | Shares minted; `getUserStatus` principal increases by credited value |
| L-02 | Non-stable asset deposit | `deposit` with a supported non-stable token | Credit matches `getDepositCredit`; token queued for swap (`processSwaps` is keeper-run) |
| L-03 | Locked deposit | `deposit` with each lock tier | Lock recorded in `getUserDepositEntries`; boost visible via `boostExpiriesOf` / `boostPosition`; earnings multiplier applied |
| L-04 | No-lock and nonEarning variants | `deposit(…, 0, …)` / `nonEarning = true` | No-lock earns base rate; nonEarning position earns nothing |
| L-05 | Below minimum | `deposit` under `minimumDepositValue` | Reverts; blocked pre-prompt |
| L-06 | Deposit for another account | `depositFor(…, recipient)` | Position lands on `recipient`, not sender |
| L-07 | Referral deposit | Router: `depositWithReferral(token, amount, lockDuration, referrer, destination, commissions)`, `tierRateFor`, `cumulativeReferred`, `allowedCommissionsList` | Deposit credited to destination; referrer commission at tier rate; disallowed commissions contract reverts |
| L-08 | Paused pool | `paused()` | Deposit UI disabled |

## 8. Earnings

| ID | Test | Functions | Expected |
|----|------|-----------|----------|
| ER-01 | Pending earnings display | `previewPendingEarnings(user)`, `getUserStatus.pendingEarnings` | Non-zero after interest accrues; matches between the two reads |
| ER-02 | Claim | `claimEarnings()` | LUSD received; `totalClaimedEarnings` increments; pending resets |
| ER-03 | Compound | `compoundEarnings(lockDuration)` | Earnings converted to new principal at chosen lock; principal grows |
| ER-04 | Distribution cadence | `getPoolStatus.nextEarningsWithdrawalTime`, `earningsFrequency` | UI shows when new earnings become available |
| ER-05 | Lock expiry behavior | `boostExpiriesOf`, `expiryInfo` after a lock lapses | Expired boost stops multiplying; principal becomes unlocked in `getUserStatus` |

## 9. Withdrawals (queue-based)

| ID | Test | Functions | Expected |
|----|------|-----------|----------|
| W-01 | Unlocked vs locked principal | `getUserStatus` | Only `unlockedPrincipal` is withdrawable; UI separates the two |
| W-02 | Request withdrawal | `requestWithdrawal(amount)` → `requestId` | Request appears in `getUserWithdrawalRequests`; shares reduced |
| W-03 | Queue visibility | `getWithdrawalQueueStatus`, `getWithdrawalRequest(requestId)` | Position in queue and funded state shown; user understands the wait |
| W-04 | Claim funded withdrawal | `claimWithdrawal(requestId)` | LUSD received once the request is funded; claiming an unfunded request reverts |
| W-05 | Limits | below `minimumWithdrawalValue`; more than `MAX_OPEN_REQUESTS_PER_ACCOUNT` open requests; amount > unlocked | Each reverts; blocked pre-prompt |
| W-06 | Queue funding | `fundWithdrawalQueue()` | Callable to advance the queue when pool has liquidity (verify who may call on the target deployment) |

## 10. Account & cross-cutting

| ID | Test | Functions | Expected |
|----|------|-----------|----------|
| X-01 | Full LP position summary | `getUserStatus`, `getUserDepositEntries` | Principal, locked/unlocked split, pending and claimed earnings all correct across mixed deposits |
| X-02 | Account transfer | `transferAccount(to)` | Entire LP position moves to `to`; irreversible — require explicit double confirmation in UI |
| X-03 | Pause handling everywhere | `paused()` on Loans, LiquidityPool, Router | All writes disabled with clear messaging; reads keep working |
| X-04 | Price feed staleness | any pricing-dependent call while feed is stale | The real reason (e.g. `PriceStale`) is surfaced pre-prompt, not a doomed tx |
| X-05 | Allowance edge cases | partial allowance, re-approval, fee buffer | Approval steps re-appear only when needed; LMLN approval covers the origination fee (buffer recommended) |
| X-06 | Decimals & formatting | `aprDecimals`, `ltvDecimals`, token `decimals()`, USD-cent fee fields | No off-by-10ⁿ display bugs across LUSD/LMLN/collateral/BNB |
| X-07 | Multi-chain config | chain 56 vs 97 | Correct addresses per chain; graceful behavior on unsupported chains |
| X-08 | Concurrent state changes | act from two wallets / refresh mid-flow | UI refetches after each confirmed tx; no stale quotes submitted |
