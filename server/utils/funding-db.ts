// server/utils/funding-db.ts

export async function createFundingCampaign(campaign: {
  campaign_id: number;
  creator_id: string;
  creator_wallet: string;
  title: string;
  description: string;
  project_type: string;
  funding_goal: string;
  creator_share: number;
  backers_share: number;
  deadline: string;
  transaction_hash: string;
  block_number?: number;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("funding_campaigns")
    .insert(campaign)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveCampaigns(projectType?: string) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("funding_campaigns")
    .select(
      "*, creator:users!funding_campaigns_creator_id_fkey(id, email, wallet_address)"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (projectType) {
    query = query.eq("project_type", projectType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getCampaignById(id: string) {
  const supabase = getSupabaseClient();

  // First get the campaign
  const { data: campaign, error: campaignError } = await supabase
    .from("funding_campaigns")
    .select(
      "*, creator:users!funding_campaigns_creator_id_fkey(id, email, wallet_address)"
    )
    .eq("id", id)
    .single();

  if (campaignError) throw campaignError;

  // Then get backers separately
  const { data: backers, error: backersError } = await supabase
    .from("campaign_backers")
    .select(
      "*, user:users!campaign_backers_backer_id_fkey(id, email, wallet_address)"
    )
    .eq("campaign_id", campaign.campaign_id);

  if (backersError) throw backersError;

  return {
    ...campaign,
    backers: backers || [],
  };
}

export async function getCampaignByCampaignId(campaignId: number) {
  const supabase = getSupabaseClient();

  // First get the campaign
  const { data: campaign, error: campaignError } = await supabase
    .from("funding_campaigns")
    .select(
      "*, creator:users!funding_campaigns_creator_id_fkey(id, email, wallet_address)"
    )
    .eq("campaign_id", campaignId)
    .single();

  if (campaignError) throw campaignError;

  // Then get backers separately
  const { data: backers, error: backersError } = await supabase
    .from("campaign_backers")
    .select(
      "*, user:users!campaign_backers_backer_id_fkey(id, email, wallet_address)"
    )
    .eq("campaign_id", campaign.campaign_id);

  if (backersError) throw backersError;

  return {
    ...campaign,
    backers: backers || [],
  };
}

export async function getCreatorCampaigns(creatorId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("funding_campaigns")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBackerCampaigns(backerId: string) {
  const supabase = getSupabaseClient();

  // Get backer records
  const { data: backerRecords, error: backerError } = await supabase
    .from("campaign_backers")
    .select("*")
    .eq("backer_id", backerId)
    .order("backed_at", { ascending: false });

  if (backerError) throw backerError;
  if (!backerRecords || backerRecords.length === 0) return [];

  // Get campaigns for these backers
  const campaignIds = backerRecords.map((b) => b.campaign_id);
  const { data: campaigns, error: campaignError } = await supabase
    .from("funding_campaigns")
    .select("*")
    .in("campaign_id", campaignIds);

  if (campaignError) throw campaignError;

  // Combine the data
  return backerRecords.map((backer) => {
    const campaign = campaigns?.find(
      (c) => c.campaign_id === backer.campaign_id
    );
    return {
      ...backer,
      campaign: campaign || null,
    };
  });
}

export async function addCampaignBacker(backer: {
  campaign_id: number;
  backer_id: string;
  backer_wallet: string;
  amount: string;
  transaction_hash: string;
}) {
  const supabase = getSupabaseClient();

  // Check if backer already exists
  const { data: existing } = await supabase
    .from("campaign_backers")
    .select("*")
    .eq("campaign_id", backer.campaign_id)
    .eq("backer_id", backer.backer_id)
    .single();

  if (existing) {
    // Update existing backer
    const newAmount = (
      BigInt(existing.amount) + BigInt(backer.amount)
    ).toString();
    const { data, error } = await supabase
      .from("campaign_backers")
      .update({ amount: newAmount })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new backer
    const { data, error } = await supabase
      .from("campaign_backers")
      .insert(backer)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function updateCampaignFunded(
  campaignId: number,
  isFunded: boolean
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("funding_campaigns")
    .update({
      is_funded: isFunded,
    })
    .eq("campaign_id", campaignId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createRevenuePayment(payment: {
  payment_id: number;
  campaign_id: number;
  payer_wallet: string;
  amount: string;
  source: string;
  transaction_hash: string;
  block_number?: number;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("revenue_payments")
    .insert(payment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCampaignRevenues(campaignId: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("revenue_payments")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createRevenueDistribution(distribution: {
  payment_id: number;
  campaign_id: number;
  recipient_id: string;
  recipient_wallet: string;
  recipient_type: "creator" | "backer";
  amount: string;
  transaction_hash?: string;
}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("revenue_distributions")
    .insert(distribution)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRevenueDistributed(paymentId: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("revenue_payments")
    .update({ is_distributed: true })
    .eq("payment_id", paymentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBackerDistributions(backerId: string) {
  const supabase = getSupabaseClient();

  // Get distributions
  const { data: distributions, error: distError } = await supabase
    .from("revenue_distributions")
    .select("*")
    .eq("recipient_id", backerId)
    .eq("recipient_type", "backer")
    .order("created_at", { ascending: false });

  if (distError) throw distError;
  if (!distributions || distributions.length === 0) return [];

  // Get campaign info
  const campaignIds = [...new Set(distributions.map((d) => d.campaign_id))];
  const { data: campaigns, error: campError } = await supabase
    .from("funding_campaigns")
    .select("campaign_id, title, project_type")
    .in("campaign_id", campaignIds);

  if (campError) throw campError;

  // Combine the data
  return distributions.map((dist) => {
    const campaign = campaigns?.find((c) => c.campaign_id === dist.campaign_id);
    return {
      ...dist,
      campaign: campaign || null,
    };
  });
}

export async function updateCampaignStats(
  campaignId: number,
  stats: {
    total_revenue?: string;
    total_distributed?: string;
  }
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("funding_campaigns")
    .update(stats)
    .eq("campaign_id", campaignId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
