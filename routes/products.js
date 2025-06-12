const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../config/db");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.post("/", upload.single("image"), (req, res) => {
  const { name, price, description } = req.body;
  const image = req.file;

  if (!name || !price || !description || !image) {
    return res.status(400).json({ message: "Semua data wajib diisi" });
  }

  const imageUrl = `http://localhost:5000/uploads/${image.filename}`;

  const sql = "INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)";
  const values = [name, price, description, imageUrl];


  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error saat menyimpan ke DB:", err);
      return res.status(500).json({ message: "Gagal menyimpan produk" });
    }
    return res.status(201).json({
      message: "Produk berhasil disimpan",
      productId: result.insertId,
    });
  });
});

router.get("/", (req, res) => {
  const sql = "SELECT * FROM products";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error mengambil data produk:", err);
      return res.status(500).json({ message: "Gagal mengambil data produk" });
    }
    return res.json(results);
  });
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM products WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error mengambil produk:", err);
      return res.status(500).json({ message: "Gagal mengambil produk" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }
    return res.json(results[0]);
  });
});

router.put("/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  const image = req.file;

  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error mencari produk:", err);
      return res.status(500).json({ message: "Gagal mencari produk" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const oldProduct = results[0];
    let newImageFilename = oldProduct.image;

    if (image) {
      newImageFilename = image.filename;
      const fs = require("fs");
      const oldImagePath = path.join(__dirname, "..", "uploads", oldProduct.image);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error("Gagal menghapus file lama:", err);
        }
      });
    }

    const sqlUpdate = "UPDATE products SET name = ?, price = ?, description = ?, image = ? WHERE id = ?";
    const values = [name || oldProduct.name, price || oldProduct.price, description || oldProduct.description, newImageFilename, id];

    db.query(sqlUpdate, values, (err2, result) => {
      if (err2) {
        console.error("Error saat update produk:", err2);
        return res.status(500).json({ message: "Gagal update produk" });
      }
      return res.json({ message: "Produk berhasil diupdate" });
    });
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Error mencari produk:", err);
      return res.status(500).json({ message: "Gagal mencari produk" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const product = results[0];

    db.query("DELETE FROM products WHERE id = ?", [id], (err2, result) => {
      if (err2) {
        console.error("Error saat hapus produk:", err2);
        return res.status(500).json({ message: "Gagal hapus produk" });
      }

      const fs = require("fs");
      const imagePath = path.join(__dirname, "..", "uploads", product.image);
      fs.unlink(imagePath, (err3) => {
        if (err3) {
          console.error("Gagal hapus file gambar:", err3);
        }
      });

      return res.json({ message: "Produk berhasil dihapus" });
    });
  });
});

module.exports = router;

