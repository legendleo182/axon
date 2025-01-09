import { supabase } from '../supabaseClient';

// Get all IP mappings
export const getAllIpMappings = async () => {
  try {
    const { data, error } = await supabase
      .from('ip_mappings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting IP mappings:', error);
    return { data: null, error: error.message };
  }
};

// Add a new IP mapping
export const addIpMapping = async (ipAddress, email) => {
  try {
    const { data, error } = await supabase
      .from('ip_mappings')
      .upsert({ ip_address: ipAddress, email })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding IP mapping:', error);
    return { data: null, error: error.message };
  }
};

// Delete an IP mapping
export const deleteIpMapping = async (ipAddress) => {
  try {
    const { error } = await supabase
      .from('ip_mappings')
      .delete()
      .eq('ip_address', ipAddress);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting IP mapping:', error);
    return { error: error.message };
  }
};

// Check if an IP is allowed and get its email
export const checkIpMapping = async (ipAddress) => {
  try {
    console.log('Checking IP mapping for:', ipAddress);
    
    const { data, error } = await supabase
      .from('ip_mappings')
      .select('email')
      .eq('ip_address', ipAddress)
      .single();

    console.log('Supabase response:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error checking IP mapping:', error);
    return { data: null, error: error.message };
  }
};

// Check if an IP is mapped
export const isIpMapped = async (ipAddress) => {
  try {
    const { data, error } = await checkIpMapping(ipAddress);
    return data !== null;
  } catch (error) {
    console.error('Error checking if IP is mapped:', error);
    return false;
  }
};
