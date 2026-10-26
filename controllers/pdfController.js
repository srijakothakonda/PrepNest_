const db = require('../config/db');
const path = require('path');
const crypto = require('crypto');

// Get all PDFs for the logged-in user
exports.list = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT *,
                    original_file_name AS original_name,
                    stored_file_name AS stored_name
             FROM pdfs
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [req.session.user.id]
        );

        res.json(rows);
    } catch (err) {
        console.error('PDF list failed:', err.message);
        res.status(500).json({
            message: 'Could not load PDFs.'
        });
    }
};

// Upload a PDF (file bytes are saved in the pdf_files table)
exports.upload = async (req, res) => {
    let conn;

    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'Please choose a PDF.'
            });
        }

        const {
            title,
            description = '',
            category = 'Others',
            total_pages
        } = req.body;

        const pages =
            total_pages === '' || total_pages === undefined
                ? 0
                : Number(total_pages);

        if (!Number.isInteger(pages) || pages < 0) {
            return res.status(400).json({
                message: 'Total pages must be a whole number.'
            });
        }

        const originalName = req.file.originalname;
        const storedName = crypto.randomUUID() + '.pdf';
        const pdfTitle = title || path.parse(originalName).name;

        conn = await db.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO pdfs (
                user_id,
                title,
                description,
                category,
                original_file_name,
                stored_file_name,
                file_size,
                total_pages
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.session.user.id,
                pdfTitle,
                description,
                category,
                originalName,
                storedName,
                req.file.size,
                pages
            ]
        );

        await conn.query(
            'INSERT INTO pdf_files (pdf_id, file_data) VALUES (?, ?)',
            [result.insertId, req.file.buffer]
        );

        await conn.commit();

        return res.status(201).json({
            id: result.insertId,
            message: 'PDF uploaded.'
        });

    } catch (err) {
        console.error('PDF upload failed:', err.message);

        if (conn) {
            try {
                await conn.rollback();
            } catch (rollbackErr) {
                console.error(rollbackErr.message);
            }
        }

        return res.status(500).json({
            message: 'Could not upload PDF. Please try again.'
        });
    } finally {
        if (conn) conn.release();
    }
};

// Open / download a PDF
exports.file = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT f.file_data, p.original_file_name
             FROM pdf_files f
             JOIN pdfs p ON p.id = f.pdf_id
             WHERE p.id = ? AND p.user_id = ?`,
            [req.params.id, req.session.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'PDF not found.'
            });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `inline; filename*=UTF-8''${encodeURIComponent(rows[0].original_file_name)}`
        );

        return res.send(rows[0].file_data);

    } catch (err) {
        console.error('PDF open failed:', err.message);

        return res.status(500).json({
            message: 'Could not open PDF.'
        });
    }
};

// Update reading progress or favorite status
exports.update = async (req, res) => {
    try {
        const { current_page, pages_read, favorite } = req.body;

        const [result] = await db.query(
            `UPDATE pdfs
             SET current_page = COALESCE(?, current_page),
                 pages_read = COALESCE(?, pages_read),
                 favorite = COALESCE(?, favorite)
             WHERE id = ? AND user_id = ?`,
            [
                current_page ?? null,
                pages_read ?? null,
                favorite ?? null,
                req.params.id,
                req.session.user.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'PDF not found.'
            });
        }

        return res.json({
            message: 'Progress saved.'
        });

    } catch (err) {
        console.error('PDF progress update failed:', err.message);

        return res.status(500).json({
            message: 'Could not save progress.'
        });
    }
};

// Delete a PDF
exports.remove = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM pdfs WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'PDF not found.'
            });
        }

        await db.query(
            'DELETE FROM pdf_files WHERE pdf_id = ?',
            [req.params.id]
        );

        return res.json({
            message: 'PDF deleted.'
        });

    } catch (err) {
        console.error('PDF deletion failed:', err.message);

        return res.status(500).json({
            message: 'Could not delete PDF.'
        });
    }
};