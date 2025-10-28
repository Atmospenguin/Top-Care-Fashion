import { prisma } from './db';

/**
 * Helper function to post a system message exactly once per (orderId, status) combination
 * Uses upsert with idempotencyKey to prevent duplicates
 */
export async function postSystemMessageOnce(params: {
  conversationId: number;
  senderId: number;
  receiverId: number;
  orderId: number;
  status: string;
  content: string;
  actorName?: string;
}) {
  const { conversationId, senderId, receiverId, orderId, status, content, actorName } = params;
  
  // Create idempotency key: orderId + ":" + status
  const idempotencyKey = `${orderId}:${status}`;
  
  // Replace placeholders in content with actual actor name
  let finalContent = content;
  if (actorName) {
    finalContent = content.replace(/@User/g, actorName).replace(/@Buyer/g, actorName).replace(/@Seller/g, actorName);
  }
  
  try {
    const message = await prisma.messages.upsert({
      where: {
        idempotencyKey: idempotencyKey,
      },
      update: {
        // If exists, update the content (in case message text changed)
        content: finalContent,
      },
      create: {
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: finalContent,
        message_type: 'SYSTEM',
        idempotencyKey: idempotencyKey,
      },
    });
    
    return message;
  } catch (error) {
    console.error('❌ Error in postSystemMessageOnce:', error);
    throw error;
  }
}

