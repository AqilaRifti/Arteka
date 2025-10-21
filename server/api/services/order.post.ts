// server/api/services/order.post.ts
import { createClient } from '@supabase/supabase-js'
import { getAuth } from '@clerk/nuxt/server'
import { ethers } from 'ethers'

const MARKETPLACE_CONTRACT_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS!
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL!

const MARKETPLACE_ABI = [
  "function purchaseListing(uint256 _listingId) public payable returns (uint256)",
  "function getListing(uint256 _listingId) public view returns (uint256, uint256, address, string, string, string, uint256, bool, uint256, uint256)"
]

export default defineEventHandler(async (event) => {
  const { userId } = getAuth(event)
  if (!userId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const { serviceId, requirements, additionalNotes } = body

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Get service details
    const { data: service } = await supabase
      .from('service_listings')
      .select('*')
      .eq('listing_id', serviceId)
      .single()

    if (!service) throw new Error('Service not found')

    // Get user wallet
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('encrypted_private_key, wallet_address')
      .eq('clerk_user_id', userId)
      .single()

    if (!wallet) throw new Error('Wallet not found')

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC)
    const signer = new ethers.Wallet(wallet.encrypted_private_key, provider)
    const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer)

    // Get listing price from blockchain
    const listing = await contract.getListing(serviceId)
    const price = listing[6]

    // Purchase on blockchain
    const tx = await contract.purchaseListing(serviceId, { value: price })
    const receipt = await tx.wait()

    // Create service order
    const { data: order } = await supabase
      .from('service_orders')
      .insert({
        listing_id: serviceId,
        buyer_clerk_id: userId,
        seller_clerk_id: service.clerk_user_id,
        buyer_wallet: wallet.wallet_address,
        seller_wallet: service.seller_wallet,
        price_paid: service.price_eth,
        requirements,
        additional_notes: additionalNotes,
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
        status: 'pending',
        expected_delivery: new Date(Date.now() + service.delivery_time * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    // Create automatic conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        conversation_id: `order_${order.id}`,
        participant1_clerk_id: userId,
        participant2_clerk_id: service.clerk_user_id,
        listing_id: serviceId,
        order_id: order.id,
        status: 'active'
      })
      .select()
      .single()

    return {
      success: true,
      orderId: order.id,
      conversationId: conversation.conversation_id,
      transactionHash: receipt.hash
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message })
  }
})

