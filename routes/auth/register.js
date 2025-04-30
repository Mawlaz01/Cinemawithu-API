var express = require('express');
var router = express.Router();
const user = require('../../model/userModel')

router.post('/register', async (req, res) => {
    try {
        let { name, email, password } = req.body

        if (!name) return res.status(400).json({ message: 'Name is required.' })
        if (!email) return res.status(400).json({ message: 'Email is required.' })
        if (!password) return res.status(400).json({ message: 'Password is required.' })

        if (await user.login(email)) return res.status(400).json({ message: 'Email already exists.' })

        if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' })
        if (!/[A-Z]/.test(password)) return res.status(400).json({ message: 'Password must have at least one uppercase letter.' })
        if (!/[a-z]/.test(password)) return res.status(400).json({ message: 'Password must have at least one lowercase letter.' })
        if (!/\d/.test(password)) return res.status(400).json({ message: 'Password must have at least one number.' })

        await user.register({ name, email, password })

        res.status(201).json({ message: 'CREATED' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = router;
