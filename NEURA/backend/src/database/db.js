import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  SUPABASE_URL or SUPABASE_ANON_KEY not set');
}

const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (supabase) {
    // Quick connection test
    supabase.from('tasks').select('count', { count: 'exact', head: true })
        .then(({ error }) => {
            if (error) console.error('❌ Supabase error:', error.message);
            else console.log('✅ Supabase connected!');
        });
}

export default supabase;
