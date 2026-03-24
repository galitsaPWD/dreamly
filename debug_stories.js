import { supabase } from './services/supabase';

async function checkStoriesData() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  console.log('Current User ID:', user?.id);

  const { data: stories, error } = await supabase
    .from('stories')
    .select('*');

  if (error) {
    console.error('Error fetching stories:', error);
  } else {
    console.log('Total stories in DB:', stories.length);
    stories.forEach(s => {
      console.log(`- Story ID: ${s.id}, Title: ${s.title}, UserID in DB: ${s.user_id}`);
    });
  }
}

checkStoriesData();
