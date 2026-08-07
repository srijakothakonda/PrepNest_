const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'An account with this email already exists.' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hash]);
    req.session.user = { id: result.insertId, name, email };
    res.status(201).json({ user: req.session.user });
  } catch (error) { res.status(500).json({ message: 'Could not create account.' }); }
};
exports.login = async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [req.body.email]);
    if (!users.length || !(await bcrypt.compare(req.body.password || '', users[0].password))) return res.status(401).json({ message: 'Incorrect email or password.' });
    const user = users[0]; req.session.user = { id: user.id, name: user.name, email: user.email };
    res.json({ user: req.session.user });
  } catch (error) { res.status(500).json({ message: 'Could not log in.' }); }
};
exports.logout = (req, res) => req.session.destroy(() => res.json({ message: 'Logged out.' }));
exports.me = (req, res) => res.json({ user: req.session.user });
