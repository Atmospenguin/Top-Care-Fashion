require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Supabase Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test basic connection
    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test auth service
    console.log('🔍 Testing auth service...');
    const { error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth service error:', authError);
    } else {
      console.log('✅ Auth service accessible');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSupabase();
