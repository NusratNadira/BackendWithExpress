const express = require("express");
const router = express.Router();
const db = require("./db");

// GET ALL PRODUCTS
router.get("/", async (req, res) => {
  try {
    const products = await db.products.findMany();
    res.send(products);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// CREATE PRODUCT
router.post("/", async (req, res) => {
  const { name, description, image, unit_id, brand_id, product_type_id, is_active } = req.body;

  try {
    const newProduct = await db.products.create({
      data: {
        name,
        description,
        image,
        unit_id,
        brand_id,
        product_type_id,
        is_active: is_active ? 1 : 0,
      },
    });

    res.status(201).send({
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// UPDATE PRODUCT
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  const { name, description, image, unit_id, brand_id, product_type_id, is_active } = req.body;

  try {
    const updated = await db.products.update({
      where: { id },
      data: {
        name,
        description,
        image,
        unit_id,
        brand_id,
        product_type_id,
        is_active,
      },
    });

    res.send({ message: "Product updated", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// DELETE PRODUCT
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await db.products.delete({ where: { id } });
    res.send({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

module.exports = router;
