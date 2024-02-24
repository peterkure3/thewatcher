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
const secretKey = process.env.SECRET_KEY;

// User registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { email, name, password, business } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database based on role
    let query, values;
    if (role === 'admin') {
      query = 'INSERT INTO admins (email, name, password) VALUES ($1, $2, $3)';
      values = [email, name, hashedPassword];
    } else {
      query = 'INSERT INTO users (email, name, password, business) VALUES ($1, $2, $3, $4)';
      values = [email, name, hashedPassword, business];
    }
    await pool.query(query, values);

    res.status(201).json({ message: `${name} added successfully` });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Admin login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Retrieve admin credentials from the database
    const query = 'SELECT * FROM admins WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    const admin = rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    // Validate admin credentials
    const validCredentials = await bcrypt.compare(password, admin.password);
    if (validCredentials) {
      const token = jwt.sign({ email }, secretKey, { expiresIn: process.env.TOKEN_EXPIRATION || '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
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

// Admin endpoint to retrieve all admins
app.get('/admin/admins', verifyToken, async (req, res) => {
  try {
    const query = 'SELECT email, name FROM admins';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Error fetching admins' });
  }
});

// Endpoint to get the number of users
app.get('/users/count', verifyToken, async (req, res) => {
  try {
    const query = 'SELECT COUNT(*) FROM users';
    const { rows } = await pool.query(query);
    const count = parseInt(rows[0].count);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ error: 'Error fetching user count' });
  }
});


// Endpoint to fetch user list
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


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});