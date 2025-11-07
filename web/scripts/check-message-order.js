const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMessageOrder() {
  try {
    const conversationIds = [98, 112, 123];

    for (const convId of conversationIds) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Conversation ID: ${convId}`);
      console.log('='.repeat(60));

      // Get messages exactly as the API does
      const conv = await prisma.conversations.findUnique({
        where: { id: convId },
        include: {
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        }
      });

      const lastMessage = conv.messages[0];
      
      console.log(`\nWhat API's conv.messages[0] returns:`);
      console.log(`  Message ID: ${lastMessage.id}`);
      console.log(`  Content: "${lastMessage.content}"`);
      console.log(`  Type: ${lastMessage.message_type}`);
      console.log(`  Sender: ${lastMessage.sender?.username || 'System'}`);
      console.log(`  Created At: ${lastMessage.created_at}`);

      // Now get the actual latest TEXT message
      const latestText = await prisma.messages.findFirst({
        where: {
          conversation_id: convId,
          message_type: "TEXT"
        },
        orderBy: { created_at: "desc" },
        include: {
          sender: { select: { username: true } }
        }
      });

      console.log(`\nWhat lastTextMessage query returns:`);
      if (latestText) {
        console.log(`  Message ID: ${latestText.id}`);
        console.log(`  Content: "${latestText.content}"`);
        console.log(`  Type: ${latestText.message_type}`);
        console.log(`  Sender: ${latestText.sender?.username || 'System'}`);
        console.log(`  Created At: ${latestText.created_at}`);
      } else {
        console.log(`  No TEXT message found`);
      }

      // Check if they're different
      const areDifferent = lastMessage.id !== latestText?.id;
      if (areDifferent) {
        console.log(`\n❌ PROBLEM FOUND!`);
        console.log(`  conv.messages[0] gives: "${lastMessage.content}" (${lastMessage.message_type})`);
        console.log(`  Latest TEXT message is: "${latestText?.content}"`);
        console.log(`  Time difference: ${(lastMessage.created_at.getTime() - (latestText?.created_at.getTime() || 0))/1000} seconds`);
      } else {
        console.log(`\n✅ They match - no problem here`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMessageOrder();

