const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Secret key for JWT
const secretKey = 'your_secret_key';

// User registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const query = 'INSERT INTO users (username, email, password, role, joined_at) VALUES ($1, $2, $3, $4, $5)';
    const values = [username, email, hashedPassword, role, new Date()];
    await pool.query(query, values);

    // Fetch total number of users
    const countQuery = 'SELECT COUNT(*) FROM users';
    const { rows } = await pool.query(countQuery);
    const totalCount = rows[0].count;

    res.status(201).json({ message: `${username} added successfully. Total users: ${totalCount}` });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Admin login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Retrieve admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Validate admin credentials
    const validCredentials = await bcrypt.compare(password, adminPassword);
    if (email === adminEmail && validCredentials) {
      const token = jwt.sign({ email }, secretKey, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'Token not provided' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.admin = decoded;
    next();
  });
};

// Admin endpoint to retrieve all users
app.get('/admin/users', verifyToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM users';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
