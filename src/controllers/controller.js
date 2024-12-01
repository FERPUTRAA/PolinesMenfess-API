const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { response } = require('../services/response')

class Controller {
    /**
     * @swagger
     * /v1/api/menfess:
     *   get:
     *     summary: Mendapatkan daftar semua menfess
     *     tags: [Menfess]
     *     responses:
     *       200:
     *         description: Daftar semua menfess berhasil diambil
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Menfess'
     *       500:
     *         description: Terjadi kesalahan pada server
     */
    static async index(req, res) {
        try {
            const menfesses = await prisma.menfess.findMany()
            return res.status(200).json(response(true, true, null, menfesses))
        } catch (error) {
            console.error(error)
            return res.status(500).json(response(false, false, "Internal Server Error", null))
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
    static async store(req, res) {
        try {
            const { sender, message, song, recipient } = req.body

            if (!sender || !message || !recipient) {
                return res.status(400).json(response(false, false, "Sender, message, recipient is required", null))
            }

            const newMenfess = await prisma.menfess.create({
                data: {
                    sender, 
                    message, 
                    song: song || '', 
                    recipient
                }
            })

            return res.status(201).json(response(true, true, "Success create menfess", newMenfess))
        } catch (error) {
            console.error(error)
            return res.status(500).json(response(false, false, "Internal Server Error", null))
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
    static async edit(req, res) {
        try {
            const id = req.params.id
            const { sender, message, song, recipient } = req.body

            const updateMenfess = await prisma.menfess.update({
                where: { id: parseInt(id) }, 
                data: {
                    sender, 
                    message, 
                    song, 
                    recipient, 
                    updatedAt: new Date()
                }
            })

            return res.status(200).json(response(true, true, "Success update menfess", updateMenfess))
        } catch (error) {
            console.error(error)
            return res.status(500).json(response(false, false, "Internal Server Error", null))
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
    static async delete(req, res) {
        try {
            const id = req.params.id

            await prisma.menfess.delete({
                where: { id: parseInt(id) }
            })

            return res.status(200).json(response(true, true, "Success delete menfess", null))
        } catch (error) {
            console.error(error)
            return res.status(500).json(response(false, false, "Internal Server Error", null))
        }
    }
}

module.exports = Controller;