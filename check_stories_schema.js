import { supabase } from './services/supabase';

async function checkSchema() {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching story:', error);
  } else {
    console.log('Story columns:', Object.keys(data[0] || {}));
  }
}

checkSchema();
