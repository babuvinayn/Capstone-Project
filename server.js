const express = require('express');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON data from the frontend
app.use(express.json());

// Your MySQL database credentials
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'YOUR_MYSQL_PASSWORD',
    database: 'aicte_curriculum'
});

// Serve your static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// New API endpoint to handle user login from Firebase
app.post('/login-with-firebase', (req, res) => {
    const { uid, displayName, email } = req.body;

    // Check if the user already exists in your database
    const findUserQuery = 'SELECT * FROM users WHERE google_id = ?';
    db.query(findUserQuery, [uid], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'Database query error.' });
        }

        if (results.length > 0) {
            // User exists, log them in
            console.log('Existing user logged in:', displayName);
            res.json({ success: true, message: 'User logged in successfully.' });
        } else {
            // User is new, create a new record in the database
            const createUserQuery = 'INSERT INTO users (google_id, display_name, email) VALUES (?, ?, ?)';
            db.query(createUserQuery, [uid, displayName, email], (err, insertResult) => {
                if (err) {
                    console.error('Database insert error:', err);
                    return res.status(500).json({ success: false, message: 'Database insert error.' });
                }
                console.log('New user created:', displayName);
                res.json({ success: true, message: 'New user created and logged in successfully.' });
            });
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});