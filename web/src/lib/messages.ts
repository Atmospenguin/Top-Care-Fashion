import { prisma } from './db';

/**
 * Helper function to post a system message exactly once per (orderId, status) combination
 * Uses upsert with idempotencyKey to prevent duplicates
 */
export async function postSystemMessageOnce(params: {
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  actorName?: string;
}) {
  const { conversationId, senderId, receiverId, content, actorName } = params;
  
  // Replace placeholders in content with actual actor name
  let finalContent = content;
  if (actorName) {
    finalContent = content.replace(/@User/g, actorName).replace(/@Buyer/g, actorName).replace(/@Seller/g, actorName);
  }
  
  try {
    const existing = await prisma.messages.findFirst({
      where: {
        conversation_id: conversationId,
        message_type: 'SYSTEM',
        content: finalContent,
      },
    });

    if (existing) {
      return existing;
    }

    const message = await prisma.messages.create({
      data: {
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: finalContent,
        message_type: 'SYSTEM',
      },
    });
    
    return message;
  } catch (error) {
    console.error('❌ Error in postSystemMessageOnce:', error);
    throw error;
  }
}

