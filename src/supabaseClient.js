import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dmtyiypkbmrnrhtvizmb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdHlpeXBrYm1ybnJodHZpem1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwNjQ3OTgsImV4cCI6MjA1MTY0MDc5OH0.WRlbRoJm5Icd3cYzZ-klJqODMFQMhpbEO-pfqU5_g1U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
});

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
