const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyLastMessageTimestamps() {
  try {
    const conversationIds = [98, 112, 123];

    for (const convId of conversationIds) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Conversation ID: ${convId}`);
      console.log('='.repeat(60));

      const conv = await prisma.conversations.findUnique({
        where: { id: convId },
        select: {
          id: true,
          last_message_at: true,
          initiator: { select: { username: true } },
          participant: { select: { username: true } }
        }
      });

      console.log(`Participants: ${conv.initiator.username} <-> ${conv.participant?.username || 'N/A'}`);
      console.log(`Database last_message_at: ${conv.last_message_at}`);

      // Get actual latest message
      const latestMessage = await prisma.messages.findFirst({
        where: { conversation_id: convId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          content: true,
          message_type: true,
          created_at: true,
          sender: { select: { username: true } }
        }
      });

      console.log(`\nActual latest message:`);
      console.log(`  Content: "${latestMessage.content}"`);
      console.log(`  Type: ${latestMessage.message_type}`);
      console.log(`  Sender: ${latestMessage.sender?.username || 'System'}`);
      console.log(`  Created at: ${latestMessage.created_at}`);

      const timestampMatch = conv.last_message_at.getTime() === latestMessage.created_at.getTime();
      console.log(`\nTimestamp match: ${timestampMatch ? '✅ YES' : '❌ NO'}`);
      
      if (!timestampMatch) {
        console.log(`⚠️ MISMATCH DETECTED!`);
        console.log(`  DB has: ${conv.last_message_at}`);
        console.log(`  Should be: ${latestMessage.created_at}`);
        console.log(`  Difference: ${Math.abs(conv.last_message_at.getTime() - latestMessage.created_at.getTime())/1000} seconds`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyLastMessageTimestamps();

