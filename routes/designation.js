const express = require('express');
const router = express.Router();

const db = require('./db');
// CRUD = CREATE, READ, UPDATE, DELETE

// ------------------------------------------------------------------
// GET ALL DESIGNATIONS + SEARCH
// ------------------------------------------------------------------
router.get('/', async (req, res) => {
    const params = JSON.parse(JSON.stringify(req.query));

    try {
        const results = await db.designation.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: params.search
                        }
                    },
                    {
                        level: params.search ? parseInt(params.search) || undefined : undefined
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

// ------------------------------------------------------------------
// CREATE NEW DESIGNATION
// ------------------------------------------------------------------
router.post('/', async (req, res) => {
    const { name, level } = req.body;

    try {
        const results = await db.designation.create({
            data: {
                name,
                level: level ? parseInt(level) : null
            }
        });

        res.status(201).send({
            message: 'Designation created successfully',
            data: results
        });
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

// ------------------------------------------------------------------
// UPDATE DESIGNATION
// ------------------------------------------------------------------
router.put('/:id', async (req, res) => {
    const { name, level } = req.body;
    const desigId = parseInt(req.params.id);

    try {
        const results = await db.designation.update({
            where: { id: desigId },
            data: {
                name,
                level: level ? parseInt(level) : null
            }
        });

        res.status(200).send({
            message: 'Designation updated successfully',
            data: results
        });
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

// ------------------------------------------------------------------
// DELETE DESIGNATION
// ------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        const results = await db.designation.delete({
            where: {
                id: parseInt(req.params.id)
            }
        });

        res.status(200).send({
            message: 'Designation deleted successfully',
            data: results
        });
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

module.exports = router;
