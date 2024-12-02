const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabasekey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey,supabaseserviceKey);

const checkConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('menfess')
            .select('id')
            .limit(1);

        if (error) {
            console.error('Koneksi gagal:', error);
            return;
        }

        console.log('Koneksi ke Supabase berhasil! Data sample:', data);
    } catch (err) {
        console.error('Terjadi kesalahan saat memeriksa koneksi:', err);
    }
};

checkConnection();

module.exports = supabase;
