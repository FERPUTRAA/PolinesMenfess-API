const SpotifyService = require('../services/spotify-service');
const supabase = require('../database');
const { response } = require('../services/response');
const NodeCache = require('node-cache');

const menfessCache = new NodeCache({ 
    stdTTL: 100,
    checkperiod: 320
});

class MenfessController {

    static async searchSpotifySong(req, res) {
        try {
          const { song } = req.query;
          if (!song || song.trim() === '') {
            return res.status(400).json({
              success: false,
              message: 'Song query is required',
            });
          }
          const tracks = await SpotifyService.searchSong(song);
          if (!tracks || tracks.length === 0) {
            return res.status(404).json({
              success: false,
              message: 'No songs found',
            });
          }
    
          return res.status(200).json({
            success: true,
            data: tracks,
          });
        } catch (error) {
          console.error('Error searching song:', error.message);
      
          return res.status(500).json({
            success: false,
            message: 'Failed to search song. Please try again later.',
          });
        }
      }

      static async createMenfessWithSpotify(req, res) {
        try {
            const { 
                sender, 
                message, 
                spotify_id, 
                recipient, 
                track_metadata 
            } = req.body;

            if (!sender || !message || !recipient || !spotify_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Sender, message, recipient, dan Spotify ID wajib diisi',
                });
            }

            let spotifyTrack = await supabase
                .from('spotify')
                .select('*')
                .eq('spotify_id', spotify_id)
                .single();

            if (spotifyTrack.error || !spotifyTrack.data) {

                const trackDetails = track_metadata || await SpotifyService.getTrackDetails(spotify_id);
    
                if (!trackDetails) {
                    return res.status(404).json({
                        success: false,
                        message: 'Detail lagu tidak ditemukan',
                    });
                }

                const { data: newSpotifyTrack, error: spotifyInsertError } = await supabase
                    .from('spotify')
                    .insert({
                        spotify_id: trackDetails.id || spotify_id,
                        name: trackDetails.name,
                        artist: trackDetails.artist,
                        cover_url: trackDetails.cover_url,
                        external_url: trackDetails.external_url
                    })
                    .select()
                    .single();
    
                if (spotifyInsertError) {
                    return res.status(500).json({
                        success: false,
                        message: 'Gagal menyimpan metadata Spotify',
                    });
                }

                spotifyTrack = { data: newSpotifyTrack };
            }

            const { data: newMenfess, error: menfessError } = await supabase
                .from('menfess')
                .insert({
                    sender,
                    message,
                    spotify_id: spotify_id,
                    recipient
                })
                .select()
                .single();
    
            if (menfessError) {
                return res.status(500).json({
                    success: false,
                    message: 'Gagal membuat menfess',
                });
            }
    
            return res.status(201).json({
                success: true,
                message: 'Berhasil membuat menfess',
                data: {
                    menfess: newMenfess,
                    spotify: spotifyTrack.data
                },
            });
    
        } catch (error) {
            console.error('Error membuat menfess:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Kesalahan Internal Server',
                error: error.message
            });
        }
    }
  
  static async getMenfessSpotify(req, res) {
    try {
        const { id, sender, recipient, date, sort } = req.query;
        
        const cacheKey = JSON.stringify({
            id, 
            sender: sender?.toLowerCase(), 
            recipient: recipient?.toLowerCase(), 
            date, 
            sort
        });

        const cachedData = menfessCache.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        let query;

        if (id) {
            query = supabase
                .from('menfess')
                .select(`
                    *,
                    spotify_id
                `)
                .eq('id', id)
                .single();
        } else {
            query = supabase
                .from('menfess')
                .select(`
                    *,
                    spotify_id
                `);

            if (sender) {
                query = query.ilike('sender', `%${sender.toLowerCase()}%`);
            }
            if (recipient) {
                query = query.ilike('recipient', `%${recipient.toLowerCase()}%`);
            }
            if (date) {
                const formattedDate = `${date} 00:00:00`;
                query = query.gte('created_at', formattedDate).lte('created_at', `${date} 23:59:59`);
            }

            const isAscending = sort === 'asc';
            query = query.order('created_at', { ascending: isAscending });
        }

        const { data: menfesses, error } = await query;

        if (error) {
            console.error(error);
            return res.status(500).json(response(false, false, "Internal Server Error", null));
        }

        if (!menfesses || (Array.isArray(menfesses) && menfesses.length === 0)) {
            return res.status(404).json(response(false, false, "Menfess tidak ditemukan", null));
        }

        const processedMenfesses = await Promise.all((Array.isArray(menfesses) ? menfesses : [menfesses]).map(async (menfess) => {
            let spotifyMetadata = null;
            
            if (menfess.spotify_id) {
                const { data: spotifyData, error: spotifyError } = await supabase
                    .from('spotify')
                    .select('*')
                    .eq('spotify_id', menfess.spotify_id)
                    .single();

                if (spotifyData) {
                    spotifyMetadata = spotifyData;
                }
            }

            return {
                ...menfess,
                track: spotifyMetadata ? {
                    title: spotifyMetadata.name,
                    artist: spotifyMetadata.artist,
                    cover_img: spotifyMetadata.cover_url,
                    external_link: spotifyMetadata.external_url,
                    spotify_embed_link: `https://open.spotify.com/embed/track/${menfess.spotify_id}`
                } : null
            };
        }));

        const responseData = response(true, true, null, processedMenfesses);

        menfessCache.set(cacheKey, responseData);

        return res.status(200).json(responseData);
    } catch (error) {
        console.error(error);
        return res.status(500).json(response(false, false, "Internal Server Error", null));
    }
}


static async getMenfessSpotifyById(req, res) {
    try {
        const id = req.params.id || req.query.id;

        if (!id) {
            return res.status(400).json(response(false, false, "ID is required", null));
        }

        const cacheKey = `menfess_${id}`;
        const cachedData = menfessCache.get(cacheKey);

        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // Ambil data menfess berdasarkan ID
        const { data: menfess, error: menfessError } = await supabase
            .from('menfess')
            .select(`*, spotify_id`)
            .eq('id', id)
            .single();

        if (menfessError) {
            console.error("Supabase error fetching menfess:", menfessError);
            return res.status(500).json(response(false, false, "Internal Server Error", null));
        }

        if (!menfess) {
            return res.status(404).json(response(false, false, "Menfess tidak ditemukan", null));
        }

        // Ambil metadata dari tabel spotify berdasarkan `spotify_id`
        let spotifyMetadata = null;
        if (menfess.spotify_id) {
            const { data: spotifyData, error: spotifyError } = await supabase
                .from('spotify')
                .select('*')
                .eq('spotify_id', menfess.spotify_id)
                .single();

            if (spotifyError) {
                console.error("Supabase error fetching Spotify metadata:", spotifyError);
            } else if (spotifyData) {
                spotifyMetadata = spotifyData;
            }
        }

        // Proses menfess
        const processedMenfess = {
            ...menfess,
            track: spotifyMetadata ? {
                title: spotifyMetadata.name,
                artist: spotifyMetadata.artist,
                cover_img: spotifyMetadata.cover_url,
                external_link: spotifyMetadata.external_url,
                spotify_embed_link: `https://open.spotify.com/embed/track/${menfess.spotify_id}`
            } : null
        };

        const responseData = response(true, true, null, [processedMenfess]);

        menfessCache.set(cacheKey, responseData);

        return res.status(200).json(responseData);
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json(response(false, false, "Internal Server Error", null));
    }
}


}

module.exports = MenfessController;