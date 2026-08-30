/**
 * Utility functions for consistent error handling across the application
 */

import {
  decodeErrorResult,
  toFunctionSelector,
  WaitForTransactionReceiptTimeoutError
} from 'viem'
import type { Abi } from 'viem'

/** The `error` entries of an ABI (viem doesn't re-export abitype's AbiError). */
type AbiErrorItem = Extract<Abi[number], { type: 'error' }>
import {
  loansAbi,
  liquidityPoolAbi,
  priceDataFeedAbi,
  priceHelperAbi,
  collateralManagerAbi
} from '@/src/generated'
import defaultLiquidatorAbiJson from '@/src/abis/DefaultLiquidator.json'
import referralDepositRouterAbiJson from '@/src/abis/ReferralDepositRouter.json'

export interface ContractError {
  message: string
  reason?: string
  code?: number
  cause?: unknown
  data?: {
    message?: string
    errorName?: string
    args?: readonly unknown[]
  }
}

/**
 * How long to wait for a receipt before handing control back to the user. A
 * transaction that has been broadcast is out of our hands; waiting on it
 * forever only means the UI can never recover.
 */
export const RECEIPT_TIMEOUT_MS = 120_000

/**
 * The transaction was broadcast but we stopped waiting for its receipt. This is
 * NOT a failure — it may well be mined a moment later — so it must be reported
 * as pending rather than as a revert. handleContractError does this for every
 * call site; callers that also need to close a dialog or reset form state catch
 * it themselves first.
 */
export class TransactionPendingError extends Error {
  readonly txHash: `0x${string}`
  constructor(txHash: `0x${string}`) {
    super('Transaction is still pending confirmation')
    this.name = 'TransactionPendingError'
    this.txHash = txHash
  }
}

/**
 * The transaction was replaced by a wallet-level cancellation (speed-up
 * cancel). The cancel transaction's receipt reports `success`, so without
 * this the UI would toast "Successful" for an operation that never happened.
 */
export class TransactionCancelledError extends Error {
  readonly txHash: `0x${string}`
  constructor(txHash: `0x${string}`) {
    super('Transaction was cancelled in the wallet')
    this.name = 'TransactionCancelledError'
    this.txHash = txHash
  }
}

/**
 * Wait for a receipt with the shared timeout, translating expiry into
 * TransactionPendingError — the single place the timeout policy lives, used by
 * every operation hook. `onTimeout` runs before the throw so callers can kick
 * off a background refresh for when the transaction does land.
 *
 * Replacements: viem follows a replaced transaction and resolves with the
 * REPLACEMENT's receipt. For `repriced`/`replaced` (speed-up) that is the
 * same operation and the receipt is genuine; for `cancelled` the "successful"
 * receipt belongs to the cancel transaction, so it is translated into
 * TransactionCancelledError instead of being returned as a success.
 *
 * The client is typed structurally so this file doesn't take on viem's deep
 * PublicClient generics; any viem public client satisfies it.
 */
export async function waitForReceiptOrPending<
  TClient extends {
    waitForTransactionReceipt: (args: {
      hash: `0x${string}`
      timeout?: number
      onReplaced?: (replacement: { reason: string }) => void
    }) => Promise<unknown>
  }
>(
  publicClient: TClient,
  txHash: `0x${string}`,
  onTimeout?: () => void
): Promise<Awaited<ReturnType<TClient['waitForTransactionReceipt']>>> {
  let replacedReason: string | undefined
  let receipt: Awaited<ReturnType<TClient['waitForTransactionReceipt']>>
  try {
    receipt = (await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: RECEIPT_TIMEOUT_MS,
      onReplaced: (replacement) => {
        replacedReason = replacement.reason
      }
    })) as Awaited<ReturnType<TClient['waitForTransactionReceipt']>>
  } catch (waitError) {
    if (waitError instanceof WaitForTransactionReceiptTimeoutError) {
      onTimeout?.()
      throw new TransactionPendingError(txHash)
    }
    throw waitError
  }
  if (replacedReason === 'cancelled') {
    throw new TransactionCancelledError(txHash)
  }
  return receipt
}

/**
 * Human-readable descriptions for all known contract custom errors.
 */
const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  // LiquidityPool
  AccountEmpty: 'Your account has no liquidity to transfer.',
  AccountNotEmpty: 'The recipient account must be empty before transferring.',
  ActiveBoostsPending:
    'Your account still has active lock boosts — wait for them to expire before this action.',
  AddressZero: 'Invalid address provided.',
  AssetNotSupported: 'This token is not supported.',
  BelowMinimumDeposit: 'Amount is below the minimum required — please increase your amount and try again.',
  BelowMinimumWithdrawal:
    'Amount is below the minimum withdrawal — please increase your amount and try again.',
  EarningsTooEarly: 'Earnings distribution is not available yet — please wait for the cooldown period.',
  InsufficientNativeFee: 'Insufficient network fee — this operation requires a small TLEMX fee. Please try again.',
  InsufficientUnlocked: 'Insufficient unlocked liquidity — your deposit may still be in its lock period.',
  InvalidAmount: 'Invalid amount provided.',
  InvalidTierDuration: 'Invalid lock tier duration.',
  InvalidTierIndex: 'Invalid lock tier index.',
  InvalidTierMultiplier: 'Invalid interest multiplier for lock tier.',
  LockDurationNotAvailable: 'The selected lock duration is not available.',
  LockTierDisabled: 'The selected lock tier is currently disabled.',
  MigrationIncomplete:
    'The pool is completing a migration — please try again shortly.',
  MissingRole: 'Your wallet does not have permission for this action.',
  NativeFeeTransferFailed: 'Failed to transfer the required network fee.',
  NoEarningsAvailable: 'No earnings available to claim.',
  NotRequestOwner: 'You do not own this withdrawal request.',
  SweepRequired:
    'The pool needs its expired boosts processed first — please try again in a moment.',
  TooManyDepositBuckets:
    'Your account has too many separate deposits — consolidate or withdraw before depositing again.',
  TooManyOpenRequests:
    'You have too many open withdrawal requests — claim or wait for existing ones first.',
  Unauthorized: 'You are not authorized to perform this action.',
  UtilizationBelowThreshold: 'Pool utilization is below the required threshold for this action.',
  WithdrawalAlreadyClaimed: 'This withdrawal has already been claimed.',
  WithdrawalNotFullyFunded: 'Withdrawal has not been fully funded yet.',
  WithdrawalRequestNotFound: 'Withdrawal request not found.',
  // Loans
  AlreadySet: 'This value has already been set.',
  ArrayMismatch: 'Input arrays must be the same length.',
  BadIndex: 'Invalid index provided.',
  BadPrice: 'Invalid price data received.',
  ConfigExists: 'This configuration already exists.',
  ConfigNotFound: 'Configuration not found.',
  DecimalsTooHigh: 'Token decimal count is too high.',
  EmptyArray: 'Input array must not be empty.',
  ExcessivePayment: 'Payment amount exceeds what is owed.',
  FirstPaymentTooLarge: 'First payment exceeds the allowed amount.',
  InsufficientBalance: 'Insufficient token balance.',
  InsufficientCollateral: 'Insufficient collateral — please check your LMLN balance.',
  InvalidAPR: 'Invalid APR configuration.',
  InvalidConfiguration: 'Invalid contract configuration.',
  InvalidDecimals: 'Invalid token decimal configuration.',
  InvalidDuration: 'Invalid loan duration selected.',
  InvalidLTV: 'Invalid LTV selected.',
  InvalidMarketValue: 'Invalid market value — the price feed may be returning an unexpected value.',
  InvalidRange: 'Invalid range configuration.',
  LoanAmountExceedsMax: 'Loan amount exceeds the maximum allowed.',
  LoanLocked: 'This loan is currently locked and cannot be modified.',
  LoanNotActive: 'This loan is no longer active — it may have defaulted or already been paid off.',
  LoanNotFound: 'Loan not found.',
  NoFeePrice: 'No fee price is configured.',
  NotDivisible: 'Amount must be evenly divisible by the payment cycle.',
  OriginationDelegateNotAuthorized: "That wallet hasn't authorized you to pay its fees.",
  RangeOverlap: 'Configuration ranges must not overlap.',
  SameAddress: 'Source and destination addresses must be different.',
  TooLarge: 'Value exceeds the maximum allowed.',
  TransferFailed: 'Token transfer failed — please check your balance and allowance.',
  UnauthorizedUser: 'You are not authorized to perform this action.',
  ZeroCycles: 'Loan must have at least one payment cycle.',
  // PriceDataFeed
  InsufficientHistoryData: 'The price feed does not have enough history yet — please try again later.',
  InvalidHistoricalData: 'The price feed returned invalid historical data.',
  InvalidPriceData: 'The price feed returned invalid price data.',
  PriceDeviationTooHigh: 'The price moved too much between updates — please wait for the next price update.',
  PriceStale: 'Price data is stale — the LMLN price feed needs to be updated before this operation can proceed.',
  SeedingPeriodEnded: 'The price feed seeding period has ended.',
  TokenNotSupported: 'This token is not supported by the price feed.',
  UpdateTooFrequent: 'Price updates are happening too frequently — please wait a moment.',
  // PriceHelper
  NoPriceAvailable: 'No price is available for this token — the price feed may need updating.',
  // CollateralManager
  AmountExceedsRecord: 'Amount exceeds the recorded collateral for this loan.',
  AssetNotAllowed: 'This token is not accepted as collateral.',
  LoanRecordInactive: 'The collateral record for this loan is no longer active.',
  LoanRecordNotFound: 'No collateral record found for this loan.',
  OnlyDefaultLiquidator: 'This action can only be performed by the liquidator contract.',
  OnlyPriceHelperConfigured: 'Collateral pricing is not configured yet.',
  // DefaultLiquidator
  AssetAlreadyRegistered: 'This asset is already registered with the liquidator.',
  AssetNotRegistered: 'This asset is not registered with the liquidator.',
  InvalidSlotIndex: 'Invalid swap slot index.',
  NoPendingCollateral: 'No pending collateral to liquidate.',
  NoProceeds: 'No proceeds available to pull.',
  OnlyCollateralManager: 'This action can only be called by the CollateralManager contract.',
  OnlyLoans: 'This action can only be called by the Loans contract.',
  SlotBusy: 'Swap slot is already in use.',
  TooSoon: 'Cannot create a new swap yet — please wait for the creation interval.',
  // ReferralDepositRouter
  BelowMinimum: 'Amount is below the minimum deposit — please increase your amount and try again.',
  EnforcedPause: 'This contract is paused — deposits are temporarily unavailable.',
  ExpectedPause: 'This action is only available while the contract is paused.',
  InsufficientGasForCommission:
    'Not enough gas was left to settle the referral commission. Try again with a higher gas limit — your deposit is unaffected.',
  InvalidRate: 'Invalid commission rate configuration.',
  NativeRefundFailed: 'Failed to refund the unused network fee.',
  NoCommission: 'No commission is available for this referrer.',
  NoLock: 'The selected lock duration is not available for this token.',
  OnlySelf: 'This action can only be performed by the contract itself.',
  SelfReferral: 'You cannot refer yourself — remove the referral link and deposit normally.',
  TiersNotSorted: 'Commission tiers are misconfigured (thresholds are not in ascending order).',
  ZeroAddress: 'Invalid address provided.',
  ZeroAmount: 'Amount must be greater than zero.',
  // OpenZeppelin base errors inherited by the upgradeable router. These should
  // never reach a user in normal operation, but the ABI-drift guard requires a
  // message for every error so a real one is never silently rendered as raw.
  AccessControlBadConfirmation: 'Role renouncement must be confirmed by the account itself.',
  AccessControlUnauthorizedAccount: 'Your wallet does not have the role required for this action.',
  AddressEmptyCode: 'The target address has no contract code.',
  ERC1967InvalidImplementation: 'The contract points at an invalid implementation.',
  ERC1967NonPayable: 'This contract cannot receive the gas token during an upgrade.',
  FailedCall: 'An internal contract call failed.',
  InvalidInitialization: 'This contract has already been initialized.',
  NotInitializing: 'This contract is not currently initializing.',
  ReentrancyGuardReentrantCall: 'Reentrant call rejected — please retry the transaction.',
  SafeERC20FailedOperation: 'A token transfer failed — please check your balance and approval.',
  UUPSUnauthorizedCallContext: 'Upgrade call made in an invalid context.',
  UUPSUnsupportedProxiableUUID: 'The proposed implementation is not upgrade-compatible.',
}

/**
 * Every custom error across all protocol contracts, sourced directly from the
 * ABIs so selectors and argument shapes can never drift from what's deployed.
 * Used to decode revert data when viem cannot (e.g. a PriceDataFeed error
 * surfacing through a Loans call, or a raw eth_call with no ABI attached).
 */
const ALL_CONTRACT_ERRORS: AbiErrorItem[] = [
  loansAbi,
  liquidityPoolAbi,
  priceDataFeedAbi,
  priceHelperAbi,
  collateralManagerAbi,
  defaultLiquidatorAbiJson as Abi,
  referralDepositRouterAbiJson as Abi
].flatMap((abi) =>
  (abi as Abi).filter((item): item is AbiErrorItem => item.type === 'error')
)

/**
 * 4-byte selector → error name, computed from the ABIs at module load.
 * Covers the case where only the selector (no argument data) is available.
 */
const ERROR_SELECTOR_MAP: Record<string, string> = Object.fromEntries(
  ALL_CONTRACT_ERRORS.map((err) => [
    toFunctionSelector(
      `${err.name}(${(err.inputs || []).map((i) => i.type).join(',')})`
    ).toLowerCase(),
    err.name
  ])
)

/**
 * Decode raw revert data (selector + encoded args) against the combined ABI.
 * Falls back to a selector-only lookup for parameterized errors whose argument
 * data is missing or malformed. Returns null when nothing matches.
 */
function decodeRevertData(
  data: string
): { errorName: string; args?: readonly unknown[] } | null {
  if (!/^0x[0-9a-fA-F]{8,}$/.test(data)) return null
  try {
    const decoded = decodeErrorResult({
      abi: ALL_CONTRACT_ERRORS,
      data: data as `0x${string}`
    })
    return { errorName: decoded.errorName, args: decoded.args }
  } catch {
    const name = ERROR_SELECTOR_MAP[data.slice(0, 10).toLowerCase()]
    return name ? { errorName: name } : null
  }
}

/**
 * Walk an error's cause chain collecting anything that looks like raw revert
 * data. Viem surfaces it in different places depending on the call path:
 * `data` as a hex string (raw RPC errors), `data.data` (nested provider
 * shapes), or embedded in message text.
 */
function findRevertDataCandidates(err: unknown, depth = 0, out: string[] = []): string[] {
  if (!err || depth > 10 || typeof err !== 'object') return out
  const e = err as Record<string, unknown>
  if (typeof e['data'] === 'string' && e['data'].startsWith('0x')) {
    out.push(e['data'])
  } else if (e['data'] && typeof e['data'] === 'object') {
    const nested = (e['data'] as Record<string, unknown>)['data']
    if (typeof nested === 'string' && nested.startsWith('0x')) out.push(nested)
  }
  if (e['cause']) findRevertDataCandidates(e['cause'], depth + 1, out)
  return out
}

/**
 * Walk the viem error cause chain to find a ContractFunctionRevertedError
 * and extract the decoded custom error name + args.
 */
function findRevertedError(
  err: unknown
): { errorName: string; args?: readonly unknown[] } | null {
  if (!err || typeof err !== 'object') return null
  const e = err as Record<string, unknown>
  if (
    e['name'] === 'ContractFunctionRevertedError' &&
    e['data'] && typeof e['data'] === 'object' &&
    (e['data'] as Record<string, unknown>)['errorName']
  ) {
    const data = e['data'] as Record<string, unknown>
    return { errorName: data['errorName'] as string, args: data['args'] as readonly unknown[] | undefined }
  }
  return findRevertedError(e['cause'])
}

/**
 * Check if an error is a user rejection (cancelled transaction).
 * Wallets vary widely here: MetaMask says "User rejected"/"User denied",
 * WalletConnect wallets emit "User canceled" or "Transaction declined", and
 * some providers nest the EIP-1193 code 4001 (or viem's
 * UserRejectedRequestError) inside the cause chain rather than at top level.
 */
export const isUserRejection = (error: ContractError): boolean => {
  const rejectionText =
    /user (rejected|denied|cancell?ed)|rejected the request|transaction (was )?declined|request rejected/i

  let current: unknown = error
  for (let depth = 0; current && typeof current === 'object' && depth <= 10; depth++) {
    const e = current as Record<string, unknown>
    if (e['code'] === 4001) return true
    if (e['name'] === 'UserRejectedRequestError') return true
    if (typeof e['message'] === 'string' && rejectionText.test(e['message'])) return true
    if (typeof e['shortMessage'] === 'string' && rejectionText.test(e['shortMessage'])) return true
    current = e['cause']
  }
  return false
}

/**
 * Check if a string is the RPC gas cap message (not a real Solidity revert reason)
 */
const isGasCapMessage = (text: string): boolean =>
  /tx fee.*exceeds the configured cap|gas required exceeds allowance/i.test(text)

/**
 * Check if any error text field matches a gas estimation / simulation failure
 */
const isGasEstimationError = (error: ContractError): boolean => {
  const texts = [error?.message, error?.reason, error?.data?.message].filter(Boolean)
  return texts.some(
    (t) =>
      t!.includes('exceeds the configured cap') ||
      t!.includes('EstimateGasExecutionError') ||
      t!.includes('gas required exceeds allowance')
  )
}

/**
 * Collect all text from an error object by stringifying the full cause chain.
 * This ensures we can find error names regardless of how deep they are nested.
 */
function collectErrorText(err: unknown, depth = 0): string {
  if (!err || depth > 10 || typeof err !== 'object') return ''
  const e = err as Record<string, unknown>
  const parts: string[] = []
  if (typeof e['shortMessage'] === 'string') parts.push(e['shortMessage'])
  if (typeof e['message'] === 'string') parts.push(e['message'])
  if (typeof e['reason'] === 'string') parts.push(e['reason'])
  if (e['data']) {
    if (typeof e['data'] === 'string') parts.push(e['data'])
    const data = e['data'] as Record<string, unknown>
    if (typeof data['message'] === 'string') parts.push(data['message'])
    if (typeof data['errorName'] === 'string') parts.push(data['errorName'])
  }
  if (e['cause']) parts.push(collectErrorText(e['cause'], depth + 1))
  return parts.join('\n')
}

/**
 * Scan collected error text for any known contract error name.
 *
 * Two tiers. The signature form ("InsufficientNativeFee()") is how viem
 * prints an undecoded custom error and cannot be prose, so it always wins.
 * The bare-word fallback is skipped when the text reads as transport/HTTP
 * prose: generic names like `Unauthorized` or `TooLarge` appear verbatim in
 * RPC-gateway errors, and matching them there would dress an infrastructure
 * failure up as a contract revert.
 */
function findErrorNameInText(text: string): string | null {
  for (const errorName of Object.keys(CONTRACT_ERROR_MESSAGES)) {
    if (new RegExp(`\\b${errorName}\\(`).test(text)) {
      return errorName
    }
  }
  if (/\bhttp\b|https?:\/\/|status code|rate.?limit|gateway|econnre/i.test(text)) {
    return null
  }
  for (const errorName of Object.keys(CONTRACT_ERROR_MESSAGES)) {
    // Match as a whole word to avoid false partial matches
    if (new RegExp(`\\b${errorName}\\b`).test(text)) {
      return errorName
    }
  }
  return null
}

/**
 * Translate awkward token-contract revert strings into plain English.
 * Catches both standard OpenZeppelin patterns and the WLEMX-style "amount <
 * balance" wording. Returns null when nothing matches.
 */
function translateTokenRevert(reason: string): string | null {
  // Most ERC20 reverts prefix the symbol (e.g. "WLEMX: ...", "ERC20: ...").
  const prefixMatch = reason.match(/^([A-Za-z0-9]+):\s*(.+)$/)
  const symbol = prefixMatch ? prefixMatch[1] : null
  const rest = prefixMatch ? prefixMatch[2] : reason
  const tokenLabel = symbol && symbol !== 'ERC20' ? symbol : 'tokens'

  // Insufficient balance — covers "amount < balance" (LMLN/WLEMX phrasing),
  // "exceeds balance" (OpenZeppelin), and similar variants.
  if (
    /amount\s*<\s*balance|exceeds\s+balance|insufficient\s+balance|transfer\s+amount\s+exceeds\s+balance/i.test(
      rest
    )
  ) {
    return `Not enough ${tokenLabel} in your wallet for this transaction.`
  }
  // Insufficient allowance — covers OpenZeppelin's "insufficient allowance"
  // and custom variants like "amount > allowance".
  if (/insufficient\s+allowance|amount\s*>\s*allowance|exceeds\s+allowance/i.test(rest)) {
    return `Your ${tokenLabel} approval isn't large enough for this transaction.`
  }
  return null
}

/**
 * Turn a decoded custom error (name + args) into a user-facing message.
 * Handles the Solidity built-ins `Error(string)` and `Panic(uint256)`.
 */
function messageForDecodedError(
  errorName: string,
  args?: readonly unknown[]
): string {
  // Standard Solidity `Error(string)` revert — the human-readable reason
  // lives in args[0]. Without this branch we'd render "Contract error: Error".
  if (errorName === 'Error') {
    const reason = args?.[0]
    if (typeof reason === 'string' && reason.length > 0) {
      return translateTokenRevert(reason) ?? reason
    }
    // Empty revert reason — there is nothing to show, so say so generically
    // instead of falling through to a "Contract error: Error" lookup miss.
    return 'The transaction was reverted by the contract.'
  }
  // Standard Solidity `Panic(uint256)` — internal compiler-emitted reverts.
  if (errorName === 'Panic') {
    return 'The contract hit an internal error (Solidity panic).'
  }
  const friendly = CONTRACT_ERROR_MESSAGES[errorName]
  return friendly ?? `Contract error: ${errorName}`
}

/**
 * Extract meaningful error message from contract error
 */
export const extractErrorMessage = (error: ContractError): string => {
  // 1. Walk the viem cause chain for a decoded revert (cleanest path)
  const revertError = findRevertedError(error)
  if (revertError) {
    return messageForDecodedError(revertError.errorName, revertError.args)
  }

  // 2. Raw revert data anywhere in the cause chain — covers raw eth_call
  //    errors (no ABI attached, viem reports "Execution reverted for an
  //    unknown reason") and sub-contract errors absent from the call's ABI.
  for (const candidate of findRevertDataCandidates(error)) {
    const decoded = decodeRevertData(candidate)
    if (decoded) {
      return messageForDecodedError(decoded.errorName, decoded.args)
    }
  }

  // 3. Collect all text from the full error / cause chain and scan for known names.
  //    Handles cases where the RPC doesn't return decoded revert data, but viem still
  //    includes the error name as a string somewhere (e.g. "Error: InsufficientNativeFee()").
  const allText = collectErrorText(error)
  const errorNameInText = findErrorNameInText(allText)
  if (errorNameInText) {
    return CONTRACT_ERROR_MESSAGES[errorNameInText]!
  }

  // 4. Revert data that only appears inside message text. Matches both viem's
  //    "reverted with the following signature: 0x…" phrasing and bare hex
  //    revert payloads (selector, or selector + 32-byte-aligned args).
  for (const match of allText.matchAll(/0x[0-9a-fA-F]{8,}/g)) {
    const hex = match[0]
    if ((hex.length - 10) % 64 !== 0) continue // not selector(+args)-shaped
    const decoded = decodeRevertData(hex)
    if (decoded) {
      return messageForDecodedError(decoded.errorName, decoded.args)
    }
  }

  // 5. Gas estimation / simulation errors — try to extract a revert reason string
  if (isGasEstimationError(error)) {
    const revertMatch = allText.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/)
    if (revertMatch && !isGasCapMessage(revertMatch[1].trim())) {
      return revertMatch[1].trim()
    }
    return 'Transaction would fail on-chain. The contract may have a precondition that is not met — check your inputs and try again.'
  }

  if (error?.reason) {
    return error.reason
  }

  if (error?.data?.message) {
    return error.data.message
  }

  // 6. Fall back to shortMessage (clean, no raw call args) or a generic message.
  const shortMsg = (error as unknown as Record<string, unknown>)?.['shortMessage'] as string | undefined
  if (shortMsg && !shortMsg.includes('Raw Call Arguments')) {
    return shortMsg
  }

  // Strip "Raw Call Arguments" noise from the full message as last resort
  const fullMsg = error?.message || ''
  const rawArgsIdx = fullMsg.indexOf('Raw Call Arguments')
  if (rawArgsIdx > 0) {
    return fullMsg.slice(0, rawArgsIdx).trim().replace(/\.$/, '') || 'Transaction failed.'
  }

  return fullMsg || 'Transaction failed.'
}

/**
 * Handle contract errors consistently across the app
 */
export const handleContractError = (
  error: ContractError,
  showToast: (options: {
    title: string
    description: string
    variant?: 'destructive'
  }) => void,
  errorTitle: string = 'Operation Failed'
): void => {
  // Don't show error toast for user rejections - user knows they cancelled.
  // Logged in dev so a rejection-pattern false positive (a node-side decline
  // matching the wallet phrasing) is diagnosable rather than silently eaten.
  if (isUserRejection(error)) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[tx] suppressed as user rejection', error)
    }
    return
  }

  // A wallet-level speed-up cancel: the user chose this, so it is not a
  // failure — but unlike a pre-signing rejection they watched a spinner,
  // so confirm that nothing happened.
  if (error instanceof TransactionCancelledError) {
    showToast({
      title: 'Transaction Cancelled',
      description:
        'Your transaction was cancelled in your wallet. No changes were made.'
    })
    return
  }

  // Broadcast but unconfirmed is not a failure. Claiming one would be wrong —
  // the transaction may land seconds later — and a "Failed" toast invites a
  // retry that double-submits. Say exactly what is known.
  if (error instanceof TransactionPendingError) {
    showToast({
      title: '⏳ Transaction Submitted',
      description:
        'Your transaction was sent but is taking longer than usual to confirm. It may still go through — check your wallet or the block explorer before trying again.'
    })
    return
  }

  // Surface the full error shape in dev so we can see exactly what the RPC
  // returned (selector, decoded errorName, cause chain). Production builds
  // strip this out via NODE_ENV checks bundled by Next.
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[contract error]', error)
  }

  const errorMessage = extractErrorMessage(error)

  showToast({
    title: errorTitle,
    description: errorMessage,
    variant: 'destructive'
  })
}
