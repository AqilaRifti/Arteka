// server/utils/types.ts
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  wallet_address?: string;
  encrypted_private_key?: string;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  listing_id: number;
  work_id?: number;
  seller_id: string;
  seller_wallet: string;
  listing_type: "product" | "service";
  category?: string;
  title: string;
  description: string;
  price: string; // in wei
  is_active: boolean;
  sold_count: number;
  transaction_hash?: string;
  block_number?: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  purchase_id: number;
  listing_id: number;
  buyer_id: string;
  buyer_wallet: string;
  seller_wallet: string;
  price: string;
  status: "pending" | "completed" | "disputed";
  transaction_hash: string;
  block_number?: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  conversation_id: number;
  participant1_wallet: string;
  participant2_wallet: string;
  listing_id?: number;
  is_active: boolean;
  transaction_hash?: string;
  created_at: string;
}

export interface Message {
  id: string;
  message_id: number;
  conversation_id: number;
  sender_wallet: string;
  encrypted_content: string;
  encrypted_key: string;
  is_unlocked: boolean;
  transaction_hash: string;
  created_at: string;
}

export const SERVICE_CATEGORIES = [
  { slug: "illustration", name: "Illustration", icon: "🎨" },
  { slug: "graphic_design", name: "Graphic Design", icon: "✨" },
  { slug: "video_editing", name: "Video Editing", icon: "🎬" },
  { slug: "animation", name: "Animation", icon: "🎞️" },
  { slug: "music_production", name: "Music", icon: "🎵" },
  { slug: "voice_over", name: "Voice Over", icon: "🎙️" },
  { slug: "writing", name: "Writing", icon: "✍️" },
  { slug: "photography", name: "Photography", icon: "📷" },
  { slug: "3d_modeling", name: "3D Modeling", icon: "🧊" },
  { slug: "web_design", name: "Web Design", icon: "💻" },
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["slug"];
