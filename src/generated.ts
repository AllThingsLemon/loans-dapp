import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Payments
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const paymentsAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false
      },
      {
        name: 'newAdmin',
        internalType: 'address',
        type: 'address',
        indexed: false
      }
    ],
    name: 'AdminChanged'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'beacon',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'BeaconUpgraded'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }
    ],
    name: 'Initialized'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false
      }
    ],
    name: 'Paused'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'orderId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true
      },
      {
        name: 'paymentId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true
      },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'PaymentProcessed'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'symbols',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false
      },
      {
        name: 'tokens',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false
      },
      {
        name: 'oracles',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'PaymentTokensSet'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newReceivers',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false
      }
    ],
    name: 'ReceiversAdded'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true
      }
    ],
    name: 'RoleAdminChanged'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'RoleGranted'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'RoleRevoked'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false
      }
    ],
    name: 'Unpaused'
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true
      }
    ],
    name: 'Upgraded'
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'newReceivers', internalType: 'address[]', type: 'address[]' }
    ],
    name: 'addReceivers',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'getAllPaymentTokenSymbols',
    outputs: [{ name: '', internalType: 'string[]', type: 'string[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'numReceivers',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'paymentDetailsById',
    outputs: [
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
      { name: 'orderId', internalType: 'uint256', type: 'uint256' },
      { name: 'receiverId', internalType: 'uint256', type: 'uint256' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'paymentIds',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'paymentTokenSymbols',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'string', type: 'string' }],
    name: 'paymentTokens',
    outputs: [
      { name: 'tokenAddress', internalType: 'address', type: 'address' },
      { name: 'chainlinkFeed', internalType: 'address', type: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'orderId', internalType: 'uint256', type: 'uint256' },
      { name: 'usdAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'receiverId', internalType: 'uint256', type: 'uint256' },
      { name: 'symbol', internalType: 'string', type: 'string' }
    ],
    name: 'processPayment',
    outputs: [{ name: 'paymentId', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'receivers',
    outputs: [
      { name: 'receiverAddress', internalType: 'address', type: 'address' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' }
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'symbols', internalType: 'string[]', type: 'string[]' },
      { name: 'tokenAddresses', internalType: 'address[]', type: 'address[]' },
      { name: 'priceFeeds', internalType: 'address[]', type: 'address[]' }
    ],
    name: 'setPaymentTokens',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' }
    ],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' }
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable'
  },
  { type: 'receive', stateMutability: 'payable' }
] as const

/**
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const paymentsAddress = {
  97: '0x6d081922D92bc7eAA44f257405FeA07f73d39e9C'
} as const

/**
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const paymentsConfig = {
  address: paymentsAddress,
  abi: paymentsAbi
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPayments = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  address: paymentsAddress
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsDefaultAdminRole =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'DEFAULT_ADMIN_ROLE'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"getAllPaymentTokenSymbols"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsGetAllPaymentTokenSymbols =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'getAllPaymentTokenSymbols'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"getRoleAdmin"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsGetRoleAdmin = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'getRoleAdmin'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"hasRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsHasRole = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'hasRole'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"numReceivers"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsNumReceivers = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'numReceivers'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"paused"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsPaused = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'paused'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"paymentDetailsById"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsPaymentDetailsById =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'paymentDetailsById'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"paymentIds"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsPaymentIds = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'paymentIds'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"paymentTokenSymbols"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsPaymentTokenSymbols =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'paymentTokenSymbols'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"paymentTokens"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsPaymentTokens = /*#__PURE__*/ createUseReadContract(
  { abi: paymentsAbi, address: paymentsAddress, functionName: 'paymentTokens' }
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsProxiableUuid = /*#__PURE__*/ createUseReadContract(
  { abi: paymentsAbi, address: paymentsAddress, functionName: 'proxiableUUID' }
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"receivers"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsReceivers = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'receivers'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useReadPaymentsSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'supportsInterface'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePayments = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  address: paymentsAddress
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"addReceivers"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsAddReceivers =
  /*#__PURE__*/ createUseWriteContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'addReceivers'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsGrantRole = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'grantRole'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'initialize'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"pause"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsPause = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'pause'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"processPayment"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsProcessPayment =
  /*#__PURE__*/ createUseWriteContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'processPayment'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsRenounceRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'renounceRole'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsRevokeRole = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'revokeRole'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"setPaymentTokens"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsSetPaymentTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'setPaymentTokens'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"unpause"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsUnpause = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'unpause'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"upgradeTo"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsUpgradeTo = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  address: paymentsAddress,
  functionName: 'upgradeTo'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWritePaymentsUpgradeToAndCall =
  /*#__PURE__*/ createUseWriteContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'upgradeToAndCall'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePayments = /*#__PURE__*/ createUseSimulateContract({
  abi: paymentsAbi,
  address: paymentsAddress
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"addReceivers"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsAddReceivers =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'addReceivers'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"grantRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsGrantRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'grantRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"initialize"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'initialize'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"pause"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsPause = /*#__PURE__*/ createUseSimulateContract(
  { abi: paymentsAbi, address: paymentsAddress, functionName: 'pause' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"processPayment"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsProcessPayment =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'processPayment'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"renounceRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'renounceRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"revokeRole"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsRevokeRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'revokeRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"setPaymentTokens"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsSetPaymentTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'setPaymentTokens'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"unpause"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsUnpause =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'unpause'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"upgradeTo"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsUpgradeTo =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'upgradeTo'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useSimulatePaymentsUpgradeToAndCall =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    address: paymentsAddress,
    functionName: 'upgradeToAndCall'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: paymentsAbi,
  address: paymentsAddress
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"AdminChanged"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'AdminChanged'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"BeaconUpgraded"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsBeaconUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'BeaconUpgraded'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"Initialized"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'Initialized'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"Paused"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsPausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'Paused'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"PaymentProcessed"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsPaymentProcessedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'PaymentProcessed'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"PaymentTokensSet"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsPaymentTokensSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'PaymentTokensSet'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"ReceiversAdded"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsReceiversAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'ReceiversAdded'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"RoleAdminChanged"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'RoleAdminChanged'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"RoleGranted"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'RoleGranted'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"RoleRevoked"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'RoleRevoked'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"Unpaused"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsUnpausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'Unpaused'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"Upgraded"`
 *
 * [__View Contract on Binance Smart Chain Testnet Bsc Scan__](https://testnet.bscscan.com/address/0x6d081922D92bc7eAA44f257405FeA07f73d39e9C)
 */
export const useWatchPaymentsUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    address: paymentsAddress,
    eventName: 'Upgraded'
  })
