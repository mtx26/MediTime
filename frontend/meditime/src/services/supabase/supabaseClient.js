// src/services/supabase/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'placeholder-key';

// Créer un client factice si les URLs ne sont pas configurées
let supabase;

try {
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    // Client factice pour éviter les erreurs
    supabase = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
        getUser: () => Promise.resolve({ data: { user: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      }
    };
    console.warn('Supabase client not configured - using placeholder');
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
  // Client factice en cas d'erreur
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      getUser: () => Promise.resolve({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
  };
}

export { supabase };
