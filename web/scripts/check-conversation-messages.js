const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConversationMessages() {
  try {
    const conversationIds = [98, 112, 123]; // Cindy, Miya, Jae conversations

    for (const convId of conversationIds) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Conversation ID: ${convId}`);
      console.log('='.repeat(60));

      // Get conversation details
      const conv = await prisma.conversations.findUnique({
        where: { id: convId },
        include: {
          initiator: { select: { id: true, username: true } },
          participant: { select: { id: true, username: true } },
          listing: { select: { id: true, name: true } }
        }
      });

      if (!conv) {
        console.log('❌ Conversation not found');
        continue;
      }

      console.log(`Initiator (Buyer): ${conv.initiator.username} (ID: ${conv.initiator.id})`);
      console.log(`Participant (Seller): ${conv.participant?.username || 'N/A'} (ID: ${conv.participant_id})`);
      console.log(`Listing: ${conv.listing?.name || 'N/A'} (ID: ${conv.listing_id})`);
      console.log(`Type: ${conv.type}`);
      console.log(`Last Message At: ${conv.last_message_at}`);

      // Get all messages for this conversation
      const messages = await prisma.messages.findMany({
        where: { conversation_id: convId },
        include: {
          sender: { select: { id: true, username: true } }
        },
        orderBy: { created_at: 'desc' }
      });

      console.log(`\n📨 Total Messages: ${messages.length}`);
      console.log('\nAll Messages (newest first):');
      console.log('-'.repeat(60));

      messages.forEach((msg, index) => {
        console.log(`\n[${index + 1}] Message ID: ${msg.id}`);
        console.log(`    Type: ${msg.message_type}`);
        console.log(`    Sender: ${msg.sender?.username || 'System'} (ID: ${msg.sender_id})`);
        console.log(`    Content: "${msg.content}"`);
        console.log(`    Created At: ${msg.created_at}`);
        console.log(`    Is Latest: ${index === 0 ? '✅ YES' : 'No'}`);
      });

      // Check for TEXT messages specifically
      const textMessages = messages.filter(m => m.message_type === 'TEXT');
      console.log(`\n📝 TEXT Messages: ${textMessages.length}`);
      if (textMessages.length > 0) {
        const latestText = textMessages[0];
        console.log(`Latest TEXT message:`);
        console.log(`    Content: "${latestText.content}"`);
        console.log(`    Sender: ${latestText.sender?.username || 'N/A'}`);
        console.log(`    Created At: ${latestText.created_at}`);
      }

      // Check for SYSTEM messages
      const systemMessages = messages.filter(m => m.message_type === 'SYSTEM');
      console.log(`\n🤖 SYSTEM Messages: ${systemMessages.length}`);
      if (systemMessages.length > 0) {
        const latestSystem = systemMessages[0];
        console.log(`Latest SYSTEM message:`);
        console.log(`    Content: "${latestSystem.content}"`);
        console.log(`    Created At: ${latestSystem.created_at}`);
      }

      // Check which message should be displayed
      const latestMessage = messages[0];
      const latestTextMessage = textMessages[0];
      console.log(`\n🎯 Which message should display?`);
      console.log(`    Latest overall: "${latestMessage?.content}" (${latestMessage?.message_type})`);
      console.log(`    Latest TEXT: "${latestTextMessage?.content || 'N/A'}"`);
      console.log(`    Backend should use: "${latestTextMessage?.content || latestMessage?.content}"`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConversationMessages();

