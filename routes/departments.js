const express = require('express');
const router = express.Router();

const db = require('./db')
// CRUD = CREATE, READ, UPDATE, DELETE

// ------------------------------------------------------------------
// GET ALL DEPARTMENTS + SEARCH
// ------------------------------------------------------------------
router.get('/', async (req, res) => {

    const params = JSON.parse(JSON.stringify(req.query))

    try {
        const results = await db.departments.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: params.search
                        }
                    },
                    {
                        dh_id: params.search ? parseInt(params.search) || undefined : undefined
                    }
                ]
            }
        });

        res.send(results)

    } catch (err) {
        console.log(err);
        res.send(err)
    }
})


// ------------------------------------------------------------------
// CREATE NEW DEPARTMENT
// ------------------------------------------------------------------
router.post('/', async (req, res) => {
    const { name, dh_id } = req.body

    try {
        const results = await db.departments.create({
            data: {
                name,
                dh_id: dh_id ? parseInt(dh_id) : null
            }
        });

        res.status(201).send({
            message: 'Department created successfully',
            data: results
        })

    } catch (error) {
        res.send(error)
    }

})


// ------------------------------------------------------------------
// UPDATE DEPARTMENT
// ------------------------------------------------------------------
router.put('/:id', async (req, res) => {
    const { name, dh_id } = req.body
    const deptId = parseInt(req.params.id)

    try {
        const results = await db.departments.update({
            where: { id: deptId },
            data: {
                name,
                dh_id: dh_id ? parseInt(dh_id) : null
            }
        });

        res.status(200).send({
            message: 'Department updated successfully',
            data: results
        })

    } catch (error) {
        res.send(error)
    }
})


// ------------------------------------------------------------------
// DELETE DEPARTMENT
// ------------------------------------------------------------------
router.delete('/:id', async (req, res) => {

    try {
        const results = await db.departments.delete({
            where: {
                id: parseInt(req.params.id)
            }
        });

        res.status(200).send({
            message: 'Department deleted successfully',
            data: results
        })

    } catch (error) {
        res.send(error)
    }

})

module.exports = router
