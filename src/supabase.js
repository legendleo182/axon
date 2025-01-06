import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase project URL and anon key
const supabaseUrl = 'https://dmtyiypkbmrnrhtvizmb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdHlpeXBrYm1ybnJodHZpem1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwNjQ3OTgsImV4cCI6MjA1MTY0MDc5OH0.WRlbRoJm5Icd3cYzZ-klJqODMFQMhpbEO-pfqU5_g1U';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  db: {
    schema: 'public'
  }
});

// Test the connection
const testConnection = async () => {
  try {
    const { error } = await supabase.from('items').select('count');
    if (error) {
      console.error('Supabase connection error:', error);
      throw error;
    }
    console.log('Supabase connection established successfully');
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    throw error;
  }
};

// Initialize connection test
testConnection().catch(console.error);

export { supabase };
