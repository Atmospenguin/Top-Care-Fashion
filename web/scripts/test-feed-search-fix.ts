/**
 * Test script for feed search fix
 * Tests that all 28 Nike items are returned when user ID 1 is provided
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from multiple possible locations
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '../.env.local'),
  resolve(__dirname, '../.env'),
];

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
  } catch (e) {
    // Ignore if file doesn't exist
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('\n   Please ensure .env.local or .env file exists with:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SearchResult {
  id: number;
  title: string;
  final_score: number;
  source: string;
}

async function testFeedSearch() {
  console.log('🧪 Testing feed search fix...\n');

  try {
    // Get user ID 1's supabase_user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, supabase_user_id, preferred_styles, preferred_brands')
      .eq('id', 1)
      .single();

    if (userError || !user) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    console.log('👤 User ID 1:');
    console.log(`   Supabase User ID: ${user.supabase_user_id}`);
    console.log(`   Preferred Styles: ${user.preferred_styles || 'None'}`);
    console.log(`   Preferred Brands: ${user.preferred_brands || 'None'}\n`);

    const testSeed = 832907322;
    const searchQuery = 'Nike';

    // Test 1: Without user ID (should return 28 items)
    console.log('📊 Test 1: Without user ID');
    const { data: resultsNoUser, error: errorNoUser } = await supabase.rpc(
      'get_search_feed',
      {
        p_supabase_user_id: null,
        p_search_query: searchQuery,
        p_limit: 1000,
        p_offset: 0,
        p_seed: testSeed,
        p_gender: null,
        p_category_id: null,
      }
    );

    if (errorNoUser) {
      console.error('❌ Error (no user):', errorNoUser);
      return;
    }

    const itemsNoUser = (resultsNoUser || []) as SearchResult[];
    console.log(`   ✅ Returned ${itemsNoUser.length} items`);
    console.log(`   Items: ${itemsNoUser.map((i) => i.id).join(', ')}\n`);

    // Test 2: With user ID 1 (should return 28 items)
    console.log('📊 Test 2: With user ID 1');
    const { data: resultsWithUser, error: errorWithUser } = await supabase.rpc(
      'get_search_feed',
      {
        p_supabase_user_id: user.supabase_user_id,
        p_search_query: searchQuery,
        p_limit: 1000,
        p_offset: 0,
        p_seed: testSeed,
        p_gender: null,
        p_category_id: null,
      }
    );

    if (errorWithUser) {
      console.error('❌ Error (with user):', errorWithUser);
      return;
    }

    const itemsWithUser = (resultsWithUser || []) as SearchResult[];
    console.log(`   ✅ Returned ${itemsWithUser.length} items`);
    console.log(`   Items: ${itemsWithUser.map((i) => i.id).join(', ')}\n`);

    // Check for missing items
    const missingItems = itemsNoUser
      .map((i) => i.id)
      .filter((id) => !itemsWithUser.some((item) => item.id === id));

    if (missingItems.length > 0) {
      console.log('❌ Missing items with user ID:');
      missingItems.forEach((id) => {
        const item = itemsNoUser.find((i) => i.id === id);
        console.log(`   - Item ${id}: ${item?.title || 'Unknown'}`);
      });
      console.log('');
    } else {
      console.log('✅ All items present with user ID!\n');
    }

    // Check specifically for items 64, 71, 486
    const targetItems = [64, 71, 486];
    console.log('🔍 Checking target items (64, 71, 486):');
    targetItems.forEach((id) => {
      const found = itemsWithUser.some((item) => item.id === id);
      const item = itemsWithUser.find((i) => i.id === id) || itemsNoUser.find((i) => i.id === id);
      if (found) {
        console.log(`   ✅ Item ${id}: ${item?.title || 'Unknown'} (score: ${item?.final_score?.toFixed(4) || 'N/A'}, source: ${item?.source || 'N/A'})`);
      } else {
        console.log(`   ❌ Item ${id}: ${item?.title || 'Unknown'} - NOT FOUND`);
      }
    });
    console.log('');

    // Summary
    console.log('📈 Summary:');
    console.log(`   Without user: ${itemsNoUser.length} items`);
    console.log(`   With user: ${itemsWithUser.length} items`);
    console.log(`   Missing: ${missingItems.length} items`);
    console.log(`   Expected: 28 items`);
    console.log('');

    if (itemsWithUser.length === 28 && missingItems.length === 0) {
      console.log('✅ Test PASSED: All 28 items returned with user ID!');
    } else {
      console.log('❌ Test FAILED: Some items are missing with user ID');
    }

    // Test pagination
    console.log('\n📄 Testing pagination:');
    console.log('   Page 1 (offset 0, limit 20):');
    const { data: page1 } = await supabase.rpc('get_search_feed', {
      p_supabase_user_id: user.supabase_user_id,
      p_search_query: searchQuery,
      p_limit: 20,
      p_offset: 0,
      p_seed: testSeed,
      p_gender: null,
      p_category_id: null,
    });
    console.log(`   ✅ Returned ${(page1 || []).length} items`);

    console.log('   Page 2 (offset 20, limit 20):');
    const { data: page2 } = await supabase.rpc('get_search_feed', {
      p_supabase_user_id: user.supabase_user_id,
      p_search_query: searchQuery,
      p_limit: 20,
      p_offset: 20,
      p_seed: testSeed,
      p_gender: null,
      p_category_id: null,
    });
    console.log(`   ✅ Returned ${(page2 || []).length} items`);

    const page1Ids = (page1 || []).map((i: SearchResult) => i.id);
    const page2Ids = (page2 || []).map((i: SearchResult) => i.id);
    const allPageIds = [...page1Ids, ...page2Ids];
    const uniquePageIds = new Set(allPageIds);

    console.log(`   Total unique items across pages: ${uniquePageIds.size}`);
    if (uniquePageIds.size === 28) {
      console.log('   ✅ Pagination test PASSED: All 28 items accessible');
    } else {
      console.log(`   ❌ Pagination test FAILED: Expected 28, got ${uniquePageIds.size}`);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testFeedSearch()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

