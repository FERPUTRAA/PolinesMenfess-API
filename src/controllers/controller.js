const supabase = require('../database');
const { response } = require('../services/response');

class Controller {
    /**
 * @swagger
 * /v1/api/menfess:
 *   get:
 *     summary: Retrieve menfess messages
 *     tags:
 *       - Menfess
 *     parameters:
 *       - in: query
 *         name: sender
 *         schema:
 *           type: string
 *         description: Filter by sender name
 *       - in: query
 *         name: recipient
 *         schema:
 *           type: string
 *         description: Filter by recipient name
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: >
 *           Filter by date (format: YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Successful retrieval of menfess messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Menfess'
 *       404:
 *         description: No menfess messages found
 *       500:
 *         description: Internal server error
 */
    static async getMenfess(req, res) {
        try {
            const { sender, recipient, date } = req.query;
            let query = supabase.from('menfess').select('*');

            if (sender) {
                query = query.ilike('sender', `%${sender.toLowerCase()}%`);
            }
            if (recipient) {
                query = query.ilike('recipient', `%${recipient.toLowerCase()}%`);
            }

            if (date) {
                const formattedDate = date + ' 00:00:00';
                query = query.gte('created_at', formattedDate).lte('created_at', `${date} 23:59:59`);
            }    

            query = query.order('created_at', { ascending: false });

            const { data: menfesses, error } = await query;
    
            if (error) {
                console.error(error);
                return res.status(500).json(response(false, false, "Internal Server Error", null));
            }
    
            if (!menfesses || menfesses.length === 0) {
                return res.status(404).json(response(false, false, "Menfess tidak ditemukan", null));
            }
    
            return res.status(200).json(response(true, true, null, menfesses));
        } catch (error) {
            console.error(error);
            return res.status(500).json(response(false, false, "Internal Server Error", null));
        }
    }

    /**
     * @swagger
     * /v1/api/menfess:
     *   post:
     *     summary: Membuat menfess baru
     *     tags: [Menfess]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Menfess'
     *     responses:
     *       201:
     *         description: Menfess berhasil dibuat
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Menfess'
     *       400:
     *         description: Data input tidak lengkap
     *       500:
     *         description: Terjadi kesalahan pada server
     */
    static async createMenfess(req, res) {
        try {
            const { sender, message, song, recipient } = req.body;

            if (!sender || !message || !recipient) {
                return res.status(400).json(response(false, false, "Sender, message, recipient is required", null));
            }

            const { data: newMenfess, error } = await supabase
                .from('menfess')
                .insert([
                    { sender, message, song: song || '', recipient }
                ]);

            if (error) {
                console.error(error);
                return res.status(500).json(response(false, false, "Internal Server Error", null));
            }

            return res.status(201).json(response(true, true, "Success create menfess", newMenfess));
        } catch (error) {
            console.error(error);
            return res.status(500).json(response(false, false, "Internal Server Error", null));
        }
    }

    /**
     * @swagger
     * /v1/api/menfess/{id}:
     *   get:
     *     summary: Menemukan menfess berdasarkan ID
     *     tags: [Menfess]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID menfess yang akan diperbarui
     *     responses:
     *       200:
     *         description: Menfess berhasil diperbarui
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Menfess'
     *       404:
     *         description: Menfess tidak ditemukan
     *       500:
     *         description: Terjadi kesalahan pada server
     */
    static async getMenfessById(req, res) {
        try {
            const id = req.params.id;

            const { data: menfessById, error } = await supabase
                .from('menfess')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error(error);
                return res.status(500).json(response(false, false, "Internal Server Error", null));
            }

            if (!menfessById) {
                return res.status(404).json(response(false, false, "Menfess tidak ditemukan", null));
            }

            return res.status(200).json(response(true, true, "Success get menfess", menfessById));
        } catch (error) {
            console.error(error);
            return res.status(500).json(response(false, false, "Internal Server Error", null));
        }
    }

    /**
     * @swagger
     * /v1/api/menfess/{id}:
     *   put:
     *     summary: Memperbarui menfess berdasarkan ID
     *     tags: [Menfess]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID menfess yang akan diperbarui
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Menfess'
     *     responses:
     *       200:
     *         description: Menfess berhasil diperbarui
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Menfess'
     *       404:
     *         description: Menfess tidak ditemukan
     *       500:
     *         description: Terjadi kesalahan pada server
     */
    static async editMenfess(req, res) {
        try {
            const id = req.params.id;
            const { sender, message, song, recipient } = req.body;

            const { data: updateMenfess, error } = await supabase
                .from('menfess')
                .update({ sender, message, song, recipient, updatedAt: new Date() })
                .eq('id', id);

            if (error) {
                console.error(error);
                return res.status(500).json(response(false, false, "Internal Server Error", null));
            }

            return res.status(200).json(response(true, true, "Success update menfess", updateMenfess));
        } catch (error) {
            console.error(error);
            return res.status(500).json(response(false, false, "Internal Server Error", null));
        }
    }

    /**
     * @swagger
     * /v1/api/menfess/{id}:
     *   delete:
     *     summary: Menghapus menfess berdasarkan ID
     *     tags: [Menfess]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID menfess yang akan dihapus
     *     responses:
     *       200:
     *         description: Menfess berhasil dihapus
     *       404:
     *         description: Menfess tidak ditemukan
     *       500:
     *         description: Terjadi kesalahan pada server
     */
    static async deleteMenfess(req, res) {
        try {
            const id = req.params.id;

            const { data, error } = await supabase
                .from('menfess')
                .delete()
                .eq('id', id);

            if (error) {
                console.error(error);
                return res.status(500).json(response(false, false, "Internal Server Error", null));
            }

            if (data.length === 0) {
                return res.status(404).json(response(false, false, "Menfess tidak ditemukan", null));
            }

            return res.status(200).json(response(true, true, "Success delete menfess", null));
        } catch (error) {
            console.error(error);
            return res.status(500).json(response(false, false, "Internal Server Error", null));
        }
    }
}

module.exports = Controller;