# QA Checklist — CollateralManager branch

Scoped to the ABI upgrades on `loans-collateral-manager`. Run through each section top-to-bottom on Citron testnet.

## 0. Prep

- [ ] `.env` has `NEXT_PUBLIC_CITRON_COLLATERAL_MANAGER_ADDRESS` set
- [ ] `npm run build` passes
- [ ] Fresh dev server — `.next` cleared, `npm run dev`, hard refresh the browser
- [ ] Wallet connected on Citron, has LUSD (loan token), LMLN (fee), and WLEMX (collateral)

## 1. CollateralManager reads

- [ ] Loan calculator page loads with no red errors in the browser console
- [ ] APR slider/display shows a sensible number (not 0%, not "...") — confirms `getAllInterestAprConfigs(WLEMX)` returned
- [ ] LTV slider shows multiple options (20/30/40/…%) — confirms `getAllOriginationFees(WLEMX)` returned
- [ ] "Collateral Required" in the summary shows **WLEMX** as the symbol (not LEMON/LEMX)

## 2. Loan creation — fresh wallet flow

Start with zero allowance on both LMLN and WLEMX.

- [ ] Click Create Loan → confirmation modal opens
- [ ] Approval checklist shows three steps; **only** step 1 is bold (steps 2 & 3 are greyed/struck-through)
- [ ] Step 1 button reads **Approve WLEMX**; click it, confirm in wallet
- [ ] After success, step 1 becomes struck-through and step 2 becomes bold
- [ ] Step 2 button reads **Approve LMLN Fee**; click it, confirm in wallet
- [ ] After success, step 2 becomes struck-through, button switches to **Confirm & Create Loan**
- [ ] Click Create Loan, confirm in wallet — transaction does NOT revert with `BEP20: transfer amount + fees exceeds balance`
- [ ] New loan appears in Active Loans with correct amount, duration, LTV

## 3. Loan creation — edge cases

- [ ] Mouse-wheel scrolling over the **How much do you need?** input does NOT change the value (input blurs)
- [ ] Entering an amount below the minimum shows the red-bordered input and error text
- [ ] Reopening the modal on a partially-approved loan (e.g. WLEMX approved but not LMLN) skips step 1 correctly
- [ ] Cancelling wallet prompt on step 1 closes modal cleanly; no stuck loading state

## 4. Active loan display

Pick a brand-new loan created from step 2.

- [ ] **Collateral** cell shows WLEMX (not LEMON/LEMX)
- [ ] **Cycles Transpired** reads `0/N` on a brand-new loan, not `1/N`
- [ ] Countdown label reads **Time Until Default** — NOT "Overdue" on creation
- [ ] Countdown value is positive and counts down
- [ ] Progress bar advances proportionally as cycle time passes

## 5. Loan payment

- [ ] Click **Make Payment** → dialog opens
- [ ] "Pay minimum payment" amount displays as expected (may be $0.10 for tiny testnet loans — that's rounding, not a bug)
- [ ] Approve LUSD for the payment amount, then Confirm Payment
- [ ] Paid amount increments, remaining balance decrements
- [ ] Progress bar advances
- [ ] After paying all cycles + principal → status flips to **UNLOCKED** and **Withdraw Collateral** button appears

## 6. Loan states past maturity

Let a short-cycle loan sit until it passes its end date without being paid off.

- [ ] **Cycles Transpired** caps at `N/N` (does not show `4/3`, `5/3`, etc.)
- [ ] Countdown label switches to **Overdue** after the cycle-long warning buffer elapses
- [ ] "Payment overdue" banner appears
- [ ] Loan status still ACTIVE until contract default triggers

## 7. Collateral withdrawal

After a loan reaches UNLOCKED.

- [ ] Click **Withdraw Collateral** → confirmation modal shows **WLEMX** symbol and correct amount
- [ ] Confirm in wallet, tx succeeds
- [ ] Loan moves out of Active Loans; WLEMX balance increases by the collateral amount

## 8. Loan extension

- [ ] Click **Extend Loan** on an active loan
- [ ] Extension dialog shows the extension fee in **LMLN** with gross-up-friendly amount
- [ ] If LMLN allowance insufficient → **Approve LMLN** button appears first
- [ ] After approval, **Confirm Extension** works
- [ ] New due date on the card reflects the extension

## 9. Loan history

- [ ] Completed/defaulted loans in history show **total paid** in the loan token symbol (LUSD), not LEMX
- [ ] Collateral amounts on history cards show the correct collateral token symbol

## 10. Regression sanity

- [ ] Liquidity page still loads (deposits, withdrawals, earnings unchanged)
- [ ] No console errors about missing `collateralTokenDecimals`, `collateralWithdrawn`, or `relockLiquidity`
- [ ] Dashboard pricing display still renders (pricing hook still works)

---

**If anything above fails, capture:**
- Loan ID (copy from the card)
- Browser console output
- Wallet transaction hash (if a tx was submitted)
