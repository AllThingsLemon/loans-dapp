import { MintError, ErrorType } from '@/src/utils/error'
import { NftType } from '@/src/utils/constants'
export interface MintModalProps {
  isOpen: boolean
  preSelectedNFTType?: MintType
  onClose: () => void
}

export type WarningMessage = {
  type: 'warning' | 'info'
  message: string
}

export interface MintDetailsProps {
  useWhitelistAllowance: boolean
  selectedType: MintType
  showMintDetails: boolean
  quantity: string
  totalCost: bigint
  totalBalance: string
  isValidQuantity: boolean
  mintCost: bigint
  mintableNFTs: bigint
  handleQuantityChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setShowMintDetails: (show: boolean) => void
  handleSubmit: () => void
  isApproved: boolean
  isApproving: boolean
  isMinting: boolean
  isMintSuccessful: boolean
  txHash: `0x${string}` | undefined
  displayMintCost: string
  displayTotalCost: string
  displayTotalMintFeeCost: string
  displayTotalNftCostWithoutFee: string
  founderAllowance: bigint
  ambassadorAllowance: bigint
  cloudxAllowance: bigint
  setUseWhitelistAllowance: (value: boolean) => void
  error: MintError | null
  clearError: () => void
  handleError: (error: any) => void
  warningMessage: WarningMessage | null
  resetState: () => void
  onBack: () => void
}

export type MintType = (typeof NftType)[keyof typeof NftType] | ''
