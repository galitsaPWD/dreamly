const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  const { data, error } = await supabase.rpc('inspect_table_columns', { table_name: 'profiles' });
  
  if (error) {
    // If RPC doesn't exist, try a simple select from a known table or information_schema if allowed
    const { data: cols, error: err } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (err) {
      console.error('Manual Fetch Error:', err.message);
    } else {
      console.log('Available Columns:', Object.keys(cols[0] || {}));
    }
  } else {
    console.log('Table Columns:', data);
  }
}

inspectSchema();
