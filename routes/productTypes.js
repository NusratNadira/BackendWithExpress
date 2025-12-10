const express = require('express');
const router = express.Router();

const db = require('./db');
// CRUD = CREATE, READ, UPDATE, DELETE

// --------------------------------------------------------------
// GET ALL PRODUCT TYPES + SEARCH
// --------------------------------------------------------------
router.get('/', async (req, res) => {

    const params = JSON.parse(JSON.stringify(req.query));

    try {
        const results = await db.product_types.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: params.search || ""
                        }
                    },
                    {
                        parent_id: params.search ? parseInt(params.search) || undefined : undefined
                    }
                ]
            }
        });

        res.send(results);
    } catch (err) {
        console.log(err);
        res.send(err);
    }
});


// --------------------------------------------------------------
// CREATE NEW PRODUCT TYPE
// --------------------------------------------------------------
router.post('/', async (req, res) => {
    const { name, parent_id, is_active } = req.body;

    console.log("req.body=>", req.body);

    try {
        const results = await db.product_types.create({
            data: {
                name,
                parent_id: parent_id ? parseInt(parent_id) : null,
                is_active: is_active ? 1 : 0
            }
        });

        res.status(201).send({
            message: 'Product Type created successfully',
            data: results
        });
    } catch (error) {
        res.send(error);
    }
});


// --------------------------------------------------------------
// UPDATE PRODUCT TYPE
// --------------------------------------------------------------
router.put('/:id', async (req, res) => {
    const { name, parent_id, is_active } = req.body;
    const typeId = parseInt(req.params.id);

    try {
        const results = await db.product_types.update({
            where: { id: typeId },
            data: {
                name,
                parent_id: parent_id ? parseInt(parent_id) : null,
                is_active: is_active ? 1 : 0
            }
        });

        res.status(200).send({
            message: 'Product Type updated successfully',
            data: results
        });

    } catch (error) {
        res.send(error);
    }
});


// --------------------------------------------------------------
// DELETE PRODUCT TYPE
// --------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const results = await db.product_types.delete({
            where: {
                id: parseInt(req.params.id)
            }
        });

        res.status(200).send({
            message: 'Product Type deleted successfully',
            data: results
        });

    } catch (error) {
        res.send(error);
    }
});


module.exports = router;
