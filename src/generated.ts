import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Payments
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
        name: 'receivers',
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
      { name: 'receivers', internalType: 'address[]', type: 'address[]' }
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
    inputs: [],
    name: 'getAllReceivers',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    inputs: [{ name: 'receiverId', internalType: 'uint256', type: 'uint256' }],
    name: 'getReceiver',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
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
      { name: 'tokens', internalType: 'address[]', type: 'address[]' },
      { name: 'oracles', internalType: 'address[]', type: 'address[]' }
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
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'string', type: 'string' }
    ],
    name: 'totalUSDAmount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__
 */
export const useReadPayments = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 */
export const useReadPaymentsDefaultAdminRole =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    functionName: 'DEFAULT_ADMIN_ROLE'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"getAllPaymentTokenSymbols"`
 */
export const useReadPaymentsGetAllPaymentTokenSymbols =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    functionName: 'getAllPaymentTokenSymbols'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"getAllReceivers"`
 */
export const useReadPaymentsGetAllReceivers =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    functionName: 'getAllReceivers'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"getReceiver"`
 */
export const useReadPaymentsGetReceiver = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  functionName: 'getReceiver'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"getRoleAdmin"`
 */
export const useReadPaymentsGetRoleAdmin = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  functionName: 'getRoleAdmin'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"hasRole"`
 */
export const useReadPaymentsHasRole = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  functionName: 'hasRole'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"paused"`
 */
export const useReadPaymentsPaused = /*#__PURE__*/ createUseReadContract({
  abi: paymentsAbi,
  functionName: 'paused'
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"paymentDetailsById"`
 */
export const useReadPaymentsPaymentDetailsById =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    functionName: 'paymentDetailsById'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"paymentTokenSymbols"`
 */
export const useReadPaymentsPaymentTokenSymbols =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    functionName: 'paymentTokenSymbols'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"paymentTokens"`
 */
export const useReadPaymentsPaymentTokens = /*#__PURE__*/ createUseReadContract(
  { abi: paymentsAbi, functionName: 'paymentTokens' }
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const useReadPaymentsProxiableUuid = /*#__PURE__*/ createUseReadContract(
  { abi: paymentsAbi, functionName: 'proxiableUUID' }
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadPaymentsSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    functionName: 'supportsInterface'
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"totalUSDAmount"`
 */
export const useReadPaymentsTotalUsdAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: paymentsAbi,
    functionName: 'totalUSDAmount'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__
 */
export const useWritePayments = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"addReceivers"`
 */
export const useWritePaymentsAddReceivers =
  /*#__PURE__*/ createUseWriteContract({
    abi: paymentsAbi,
    functionName: 'addReceivers'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"grantRole"`
 */
export const useWritePaymentsGrantRole = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  functionName: 'grantRole'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"initialize"`
 */
export const useWritePaymentsInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  functionName: 'initialize'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"pause"`
 */
export const useWritePaymentsPause = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  functionName: 'pause'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"processPayment"`
 */
export const useWritePaymentsProcessPayment =
  /*#__PURE__*/ createUseWriteContract({
    abi: paymentsAbi,
    functionName: 'processPayment'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"renounceRole"`
 */
export const useWritePaymentsRenounceRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: paymentsAbi,
    functionName: 'renounceRole'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"revokeRole"`
 */
export const useWritePaymentsRevokeRole = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  functionName: 'revokeRole'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"setPaymentTokens"`
 */
export const useWritePaymentsSetPaymentTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: paymentsAbi,
    functionName: 'setPaymentTokens'
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"unpause"`
 */
export const useWritePaymentsUnpause = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  functionName: 'unpause'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const useWritePaymentsUpgradeTo = /*#__PURE__*/ createUseWriteContract({
  abi: paymentsAbi,
  functionName: 'upgradeTo'
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useWritePaymentsUpgradeToAndCall =
  /*#__PURE__*/ createUseWriteContract({
    abi: paymentsAbi,
    functionName: 'upgradeToAndCall'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__
 */
export const useSimulatePayments = /*#__PURE__*/ createUseSimulateContract({
  abi: paymentsAbi
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"addReceivers"`
 */
export const useSimulatePaymentsAddReceivers =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    functionName: 'addReceivers'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"grantRole"`
 */
export const useSimulatePaymentsGrantRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    functionName: 'grantRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"initialize"`
 */
export const useSimulatePaymentsInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    functionName: 'initialize'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"pause"`
 */
export const useSimulatePaymentsPause = /*#__PURE__*/ createUseSimulateContract(
  { abi: paymentsAbi, functionName: 'pause' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"processPayment"`
 */
export const useSimulatePaymentsProcessPayment =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    functionName: 'processPayment'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"renounceRole"`
 */
export const useSimulatePaymentsRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    functionName: 'renounceRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"revokeRole"`
 */
export const useSimulatePaymentsRevokeRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    functionName: 'revokeRole'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"setPaymentTokens"`
 */
export const useSimulatePaymentsSetPaymentTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    functionName: 'setPaymentTokens'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"unpause"`
 */
export const useSimulatePaymentsUnpause =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    functionName: 'unpause'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"upgradeTo"`
 */
export const useSimulatePaymentsUpgradeTo =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    functionName: 'upgradeTo'
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link paymentsAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useSimulatePaymentsUpgradeToAndCall =
  /*#__PURE__*/ createUseSimulateContract({
    abi: paymentsAbi,
    functionName: 'upgradeToAndCall'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__
 */
export const useWatchPaymentsEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: paymentsAbi
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const useWatchPaymentsAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'AdminChanged'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const useWatchPaymentsBeaconUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'BeaconUpgraded'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"Initialized"`
 */
export const useWatchPaymentsInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'Initialized'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"Paused"`
 */
export const useWatchPaymentsPausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'Paused'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"PaymentProcessed"`
 */
export const useWatchPaymentsPaymentProcessedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'PaymentProcessed'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"PaymentTokensSet"`
 */
export const useWatchPaymentsPaymentTokensSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'PaymentTokensSet'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"ReceiversAdded"`
 */
export const useWatchPaymentsReceiversAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'ReceiversAdded'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"RoleAdminChanged"`
 */
export const useWatchPaymentsRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'RoleAdminChanged'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"RoleGranted"`
 */
export const useWatchPaymentsRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'RoleGranted'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"RoleRevoked"`
 */
export const useWatchPaymentsRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'RoleRevoked'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"Unpaused"`
 */
export const useWatchPaymentsUnpausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'Unpaused'
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link paymentsAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchPaymentsUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: paymentsAbi,
    eventName: 'Upgraded'
  })
