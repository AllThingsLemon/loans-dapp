import { createPublicClient, http, parseAbi } from 'viem'
const WALLET='0x7bB4c2C843b67D6636B1fEFfAB8a4AC9bc5237A0'
for (const url of ['https://bsc-dataseed.binance.org','https://bsc-dataseed1.defibit.io','https://rpc.ankr.com/bsc']) {
  try {
    const c=createPublicClient({transport:http(url)})
    const n=await c.getBlockNumber()
    console.log(`RPC ok: ${url}  head=${n}`)
    const bal=await c.getBalance({address:WALLET})
    console.log(`  wallet BNB balance: ${Number(bal)/1e18}`)
    break
  } catch(e){ console.log(`RPC failed: ${url} -> ${(e.shortMessage||e.message||'').slice(0,60)}`) }
}
