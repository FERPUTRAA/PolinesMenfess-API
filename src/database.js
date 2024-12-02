const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseservicerole = process.env.SUPABASE_SERVICE_ROLE;
const supabase = createClient(supabaseUrl, supabaseAnonKey,supabaseservicerole);

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
