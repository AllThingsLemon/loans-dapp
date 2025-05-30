import { Crown, Users } from 'lucide-react'

export const mockDashboardData = {
  walletBalances: {
    native: 1.2345,
    in8: 3456,
    usdt: 5000,
    usdc: 3000
  },
  nftInfo: {
    ambassador: {
      icon: <Users className="h-6 w-6 text-blue-500" />,
      title: 'Ambassador',
      description:
        'Ambassador NFTs grant voting rights and access to exclusive community events. They earn 2% of platform fees.',
      total: 234,
      staked: 234,
      unstaked: 0
    },
    founder: {
      icon: <Crown className="h-6 w-6 text-yellow-500" />,
      title: 'Founder',
      description:
        'Founder NFTs offer premium benefits, including higher voting power and a share in platform governance. They earn 5% of platform fees.',
      total: 67,
      staked: 60,
      unstaked: 7
    }
  },
  isEligibleForRewards: true,
  pendingRewardsAmount: 12234,
  pendingDividends: 1234.56,
  hasNitroRewards: true,
  in8ToUsdRate: 0.3,
  stakedTokens: 5000
}

// Derived data
export const walletBalances = mockDashboardData.walletBalances
export const in8ToUsdRate = mockDashboardData.in8ToUsdRate
export const stakedTokens = mockDashboardData.stakedTokens
export const isEligibleForRewards = mockDashboardData.isEligibleForRewards
export const pendingRewardsAmount = mockDashboardData.pendingRewardsAmount
export const hasFounderLicenses = mockDashboardData.nftInfo.founder.staked > 0
export const pendingDividends = mockDashboardData.pendingDividends
export const hasNitroRewards = mockDashboardData.hasNitroRewards

export const totalNfts =
  mockDashboardData.nftInfo.ambassador.total +
  mockDashboardData.nftInfo.founder.total
export const totalStakedNFTs =
  mockDashboardData.nftInfo.ambassador.staked +
  mockDashboardData.nftInfo.founder.staked
export const dailyRewardRateIN8 = totalStakedNFTs * 5.43
export const dailyRewardRateUSD = dailyRewardRateIN8 * in8ToUsdRate
