const express = require('express');
const router = express.Router();

const db = require('./db')
// CRUD = CREATE, READ, UPDATE, DELETE

router.get('/', async (req, res) => {
     //res.send('Hello World! From users')
    try {
        const [results, fields] = await db.query('SELECT * FROM users');

        console.log(results); // results contains rows returned by server
        console.log(fields); // fields contains extra meta data about results, if available

        res.send(results)
    } catch (err) {
        console.log(err);
        res.send(err)
    }
})


router.post('/', async (req, res) => {
    const { name, email, password, is_active } = req.body

    try {
        const [results, fields] = await db.query('INSERT INTO users (name, email, password, is_active) VALUES (?, ?, ?, ?)', [name, email, password, is_active]);
        res.send(results)
    } catch (error) {
        res.send(error)
    }

})



router.put('/:id', async (req, res) => {
    const { name, email, password, is_active } = req.body

    try {
        const [results, fields] = await db.query('UPDATE users SET name = ?, email = ?, password = ?, is_active = ? WHERE id = ?', [name, email, password, is_active, req.params.id]);
        res.send(results)
    } catch (error) {
        res.send(error)
    }

})


router.delete('/:id', async (req, res) => {

    try {
        const [results, fields] = await db.query('DELETE FROM users WHERE id = ?', [ req.params.id]);
        res.send(results)
    } catch (error) {
        res.send(error)
    }

})

module.exports = router