const SpotifyService = require('../services/spotify-service');
const supabase = require('../database');
const { response } = require('../services/response');

class MenfessController {
  static async createMenfessWithSpotify(req, res) {
    try {
      const { sender, message, spotify_id, recipient } = req.body;
  
      if (!sender || !message || !recipient) {
        return res.status(400).json({
          success: false,
          message: 'Sender, message, recipient is required',
        });
      }

      if (!spotify_id) {
        return res.status(400).json({
          success: false,
          message: 'Spotify ID is required',
        });
      }

      const { data: newMenfess, error } = await supabase.from('menfess').insert([
        {
          sender,
          message,
          spotify_id: spotify_id,
          recipient,
        },
      ]);
  
      if (error) {
        console.error(error);
        return res.status(500).json({
          success: false,
          message: 'Internal Server Error',
        });
      }
  
      return res.status(201).json({
        success: true,
        message: 'Success create menfess',
        data: newMenfess,
      });
    } catch (error) {
      console.error('Error creating menfess:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  }
  
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
  

  static async getMenfessSpotify(req, res) {
    try {
        const { id, sender, recipient, date, sort } = req.query;

        let query;

        if (id) {
            query = supabase.from('menfess').select('*').eq('id', id);
        } else {
            query = supabase.from('menfess').select('*');

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

        if (!menfesses || menfesses.length === 0) {
            return res.status(404).json(response(false, false, "Menfess tidak ditemukan", null));
        }

        const menfessWithTracks = await Promise.all(menfesses.map(async (menfess) => {
            let trackDetails = null;

            if (menfess.spotify_id) {
                try {
                    trackDetails = await SpotifyService.getTrackDetails(menfess.spotify_id);
                } catch (error) {
                    console.error('Error fetching track details from Spotify:', error.message);
                }
            }

            return {
                ...menfess,
                track: trackDetails ? {
                    title: trackDetails.name,
                    artist: trackDetails.artist,
                    cover_img: trackDetails.cover_url,
                    preview_link: trackDetails.preview_url,
                    spotify_embed_link: `https://open.spotify.com/embed/track/${menfess.spotify_id}`
                } : null,
            };
        }));

        return res.status(200).json(response(true, true, null, menfessWithTracks));
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

        const query = supabase.from('menfess').select('*').eq('id', id);

        const { data: menfesses, error } = await query;

        if (error) {
            console.error(error);
            return res.status(500).json(response(false, false, "Internal Server Error", null));
        }

        if (!menfesses || menfesses.length === 0) {
            return res.status(404).json(response(false, false, "Menfess tidak ditemukan", null));
        }

        const menfessWithTracks = await Promise.all(menfesses.map(async (menfess) => {
            let trackDetails = null;

            if (menfess.spotify_id) {
                try {
                    trackDetails = await SpotifyService.getTrackDetails(menfess.spotify_id);
                } catch (error) {
                    console.error('Error fetching track details from Spotify:', error.message);
                }
            }

            return {
                ...menfess,
                track: trackDetails ? {
                    title: trackDetails.name,
                    artist: trackDetails.artist,
                    cover_img: trackDetails.cover_url,
                    preview_link: trackDetails.preview_url,
                    spotify_embed_link: `https://open.spotify.com/embed/track/${menfess.spotify_id}`
                } : null,
            };
        }));

        return res.status(200).json(response(true, true, null, menfessWithTracks));
    } catch (error) {
        console.error(error);
        return res.status(500).json(response(false, false, "Internal Server Error", null));
    }
}

}

module.exports = MenfessController;