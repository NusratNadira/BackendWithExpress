// app.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { body, param, query, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 4000;

// --- DB pool ---
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mariadb',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'example',
  database: process.env.DB_NAME || 'product_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- static uploads dir ---
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// Accept JSON bodies
app.use(express.json());

// --- multer for file uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png','image/jpeg','image/jpg','image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'), false);
  }
});

// --- helpers ---
const handleValidation = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
  next();
};

// --- Routes ---
// GET /product?search=&status=
app.get('/product',
  [
    query('search').optional().isString(),
    query('status').optional().isIn(['0','1',''])
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { search = '', status } = req.query;
      const conn = await pool.getConnection();
      try {
        let sql = 'SELECT * FROM product';
        const where = [];
        const params = [];

        if (status === '0' || status === '1') {
          where.push('is_active = ?');
          params.push(status);
        }

        if (search && search.trim() !== '') {
          where.push('(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)');
          const s = `%${search.toLowerCase()}%`;
          params.push(s, s);
        }

        if (where.length) sql += ' WHERE ' + where.join(' AND ');
        sql += ' ORDER BY id DESC';

        const [rows] = await conn.query(sql, params);
        res.json(rows);
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /product/:id
app.get('/product/:id',
  [ param('id').isInt({ gt: 0 }) ],
  handleValidation,
  async (req, res) => {
    try {
      const { id } = req.params;
      const conn = await pool.getConnection();
      try {
        const [rows] = await conn.query('SELECT * FROM product WHERE id = ? LIMIT 1', [id]);
        if (!rows.length) return res.status(404).json({ error: 'Product not found' });
        res.json(rows[0]);
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /product - supports multipart/form-data (image) OR JSON bodies
app.post('/product',
  upload.single('image'), // if multipart contains file, accessible at req.file
  [
    body('name').exists().isLength({ min: 1 }).trim().escape(),
    body('description').optional().trim().escape(),
    body('unit_id').exists().isInt({ gt: 0 }),
    body('brand_id').exists().isInt({ gt: 0 }),
    body('product_type_id').exists().isInt({ gt: 0 }),
    body('is_active').optional().isInt().isIn([0,1])
  ],
  async (req, res) => {
    // note: multer already handled file; if client sent JSON with no file, req.file == undefined
    // To accept JSON body, ensure body parser is aware: express.json() used above.
    // But express-validator expects fields in req.body - when using multipart, multer populates req.body for non-file fields.
    try {
      // if multer rejected file due to wrong type/size it'll have thrown; catch below
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // if multer saved a file but validation fails - remove file
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        description = null,
        unit_id,
        brand_id,
        product_type_id,
      } = req.body;

      const is_active = (typeof req.body.is_active !== 'undefined') ? Number(req.body.is_active) : 1;
      const imagePath = req.file ? `/uploads/${req.file.filename}` : (req.body.image || null);

      const conn = await pool.getConnection();
      try {
        const [result] = await conn.query(
          `INSERT INTO product (name, description, image, unit_id, brand_id, product_type_id, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, description, imagePath, Number(unit_id), Number(brand_id), Number(product_type_id), is_active ? 1 : 0]
        );
        const [rows] = await conn.query('SELECT * FROM product WHERE id = ?', [result.insertId]);
        res.status(201).json(rows[0]);
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('POST /product error:', err);
      // cleanup file on error
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /product/:id - supports file upload or JSON
app.put('/product/:id',
  upload.single('image'),
  [
    param('id').isInt({ gt: 0 }),
    body('name').optional().isLength({ min: 1 }).trim().escape(),
    body('description').optional().trim().escape(),
    body('unit_id').optional().isInt({ gt: 0 }),
    body('brand_id').optional().isInt({ gt: 0 }),
    body('product_type_id').optional().isInt({ gt: 0 }),
    body('is_active').optional().isInt().isIn([0,1])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ errors: errors.array() });
      }

      const id = Number(req.params.id);
      const conn = await pool.getConnection();
      try {
        const [existing] = await conn.query('SELECT * FROM product WHERE id = ? LIMIT 1', [id]);
        if (!existing.length) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(404).json({ error: 'Product not found' });
        }

        const prev = existing[0];

        const name = req.body.name ?? prev.name;
        const description = (typeof req.body.description !== 'undefined') ? req.body.description : prev.description;
        const unit_id = (typeof req.body.unit_id !== 'undefined') ? Number(req.body.unit_id) : prev.unit_id;
        const brand_id = (typeof req.body.brand_id !== 'undefined') ? Number(req.body.brand_id) : prev.brand_id;
        const product_type_id = (typeof req.body.product_type_id !== 'undefined') ? Number(req.body.product_type_id) : prev.product_type_id;
        const is_active = (typeof req.body.is_active !== 'undefined') ? Number(req.body.is_active) : prev.is_active;

        let imagePath = prev.image;
        if (req.file) {
          // delete previous image file if it's local (starts with /uploads)
          if (prev.image && prev.image.startsWith('/uploads')) {
            const prevPath = path.join(__dirname, prev.image);
            if (fs.existsSync(prevPath)) {
              try { fs.unlinkSync(prevPath); } catch (e) { /* ignore */ }
            }
          }
          imagePath = `/uploads/${req.file.filename}`;
        } else if (typeof req.body.image !== 'undefined') {
          // allow to replace image with an URL or null
          imagePath = req.body.image || null;
        }

        await conn.query(
          `UPDATE product SET name = ?, description = ?, image = ?, unit_id = ?, brand_id = ?, product_type_id = ?, is_active = ? WHERE id = ?`,
          [name, description, imagePath, unit_id, brand_id, product_type_id, is_active ? 1 : 0, id]
        );

        const [rows] = await conn.query('SELECT * FROM product WHERE id = ?', [id]);
        res.json(rows[0]);
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('PUT /product/:id error', err);
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /product/:id
app.delete('/product/:id',
  [ param('id').isInt({ gt: 0 }) ],
  handleValidation,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const conn = await pool.getConnection();
      try {
        const [rows] = await conn.query('SELECT * FROM product WHERE id = ? LIMIT 1', [id]);
        if (!rows.length) return res.status(404).json({ error: 'Product not found' });

        // delete local image file if exists and is local path
        const product = rows[0];
        if (product.image && product.image.startsWith('/uploads')) {
          const p = path.join(__dirname, product.image);
          if (fs.existsSync(p)) {
            try { fs.unlinkSync(p); } catch (e) { /* ignore */ }
          }
        }

        await conn.query('DELETE FROM product WHERE id = ?', [id]);
        res.json({ success: true });
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// health
app.get('/', (req, res) => res.json({ ok: true }));

// global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
