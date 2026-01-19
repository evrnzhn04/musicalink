import { createClient } from '@supabase/supabase-js';
import EncryptedStorage from 'react-native-encrypted-storage';
import Config from 'react-native-config';


const supabaseUrl = Config.SUPABASE_URL!;
const supabaseAnonKey = Config.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: EncryptedStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});