const express = require('express');
const router = express.Router();
 
const db = require('./db')
// CRUD = CREATE, READ, UPDATE, DELETE
 
router.get('/', async (req, res) => {
    // res.send('Hello World! From users')
 
    // console.log('req.query=>', req.query)
    const params = JSON.parse(JSON.stringify(req.query))
    // console.log('params=>', params)
    try {
        // const [results, fields] = await db.query('SELECT * FROM users');
        const results = await db.user.findMany({
            where: {
                    OR: [
                        {
                            email: {
                                contains: params.search
                            }
                        },
                        {
                            name: {
                                contains: params.search
                            }
                        }
                    ]
            }
        });
 
        // console.log(results); // results contains rows returned by server
        // console.log(fields); // fields contains extra meta data about results, if available
 
        res.send(results)
    } catch (err) {
        console.log(err);
        res.send(err)
    }
})
 
 
router.post('/', async (req, res) => {
    const { name, email, password, is_active } = req.body
 
    console.log('req.body=>', req.body)
 
    try {
        // const [results, fields] = await db.query('INSERT INTO users (name, email, password, is_active) VALUES (?, ?, ?, ?)', [name, email, password, is_active]);
        const results = await db.user.create({
            // data: {
            //     name, email, password, is_active
            // }
            data: {
                name,
                email,
                password,
                is_active: is_active ? 1 : 0
            }
        });
        res.status(201).send({
            message: 'User created successfully',
            data: results
        })
    } catch (error) {
        res.send(error)
    }
 
})
 
 
 
router.put('/:id', async (req, res) => {
    const { name, email, password, is_active } = req.body
 
    const userId = parseInt(req.params.id)
 
    try {
        // const [results, fields] = await db.query('UPDATE users SET name = ?, email = ?, password = ?, is_active = ? WHERE id = ?', [name, email, password, is_active, req.params.id]);
        const results = await db.user.update({
            where: {
                id: userId
            },
            data: {
                name,
                email,
                password,
                is_active: is_active ? 1 : 0
            }
        });
       
        res.status(200).send({
            message: 'User updated successfully',
            data: results
        })
 
    } catch (error) {
        res.send(error)
    }
 
})
 
 
router.delete('/:id', async (req, res) => {
 
    try {
        // const [results, fields] = await db.query('DELETE FROM users WHERE id = ?', [ req.params.id]);
        const results = await db.user.delete({
            where: {
                id: parseInt(req.params.id)
            }
        });
       
        res.status(200).send({
            message: 'User deleted successfully',
            data: results
        })
 
    } catch (error) {
        res.send(error)
    }
 
})
 
module.exports = router
 