const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const db = new sqlite3.Database('moviedatabase.db');

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Initialize the database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        data TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS acienma(
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        languages TEXT,
        cardposterURL TEXT,
        coverPageUrl TEXT,
        fristpostURL TEXT,
        secondpostURL TEXT
        

    )`);

    db.run(`CREATE TABLE IF NOT EXISTS theatre (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        theatrename TEXT,
        screennumber TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bbooking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movietitle TEXT,
        date TEXT,
        name TEXT,
        theatre TEXT
        seatno TEXT)`);

    // Create default admin user
    db.run(`INSERT INTO users (fullname, username, password, role) VALUES ('Admin', 'admin', 'admin', 'admin')`, function(err) {
        if (err) {
            console.log('Default admin user already exists');
        }
    });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password, role } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ? AND role = ?`, [username, password, role], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (row) {
            res.json({ success: true, userId: row.id, role: row.role });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Create user endpoint (admin only)
app.post('/api/create-user', (req, res) => {
    const { fullname, username, password, role } = req.body;
    db.run(`INSERT INTO users (fullname, username, password, role) VALUES (?, ?, ?, ?)`, [fullname, username, password, role], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                res.status(400).json({ success: false, message: 'Username already exists' });
            } else {
                res.status(500).json({ success: false, error: err.message });
            }
        } else {
            res.json({ success: true });
        }
    });
});

// Fetch all users (admin only)
app.get('/api/users', (req, res) => {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ users: rows });
        }
    });
});

// Update user endpoint (admin only)
app.put('/api/users/:id', (req, res) => {
    const { username, role } = req.body;
    const { id } = req.params;
    db.run(`UPDATE users SET username = ?, role = ? WHERE id = ?`, [username, role, id], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                res.status(400).json({ success: false, message: 'Username already exists' });
            } else {
                res.status(500).json({ success: false, error: err.message });
            }
        } else {
            res.json({ success: true });
        }
    });
});

// Delete user endpoint (admin only)
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM users WHERE id = ?`, id, function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// Create movie endpoint
// Add a movie endpoint
app.post('/api/moviesdata', (req, res) => {
    const { title, description, languages, cardposterUrl, coverPageUrl, fristpostURL, secondpostURL } = req.body;
    db.run(`INSERT INTO acienma (title, description, languages, cardposterURL, coverPageUrl, fristpostURL, secondpostURL) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description, languages, cardposterUrl, coverPageUrl, fristpostURL, secondpostURL],
        function(err) {
            if (err) { 
                res.status(500).json({ success: false, error: err.message });
            } else {
                res.json({ success: true, movieId: this.lastID });
            }
        });
});

// Edit a movie endpoint
app.put('/api/moviesdata/:id', (req, res) => {
    const { title, description, languages, cardposterUrl, coverPageUrl, fristpostURL, secondpostURL } = req.body;
    const { id } = req.params;
    db.run(`UPDATE acienma SET title = ?, description = ?, languages = ?, cardposterURL = ?, coverPageUrl = ?, fristpostURL = ?, secondpostURL = ? WHERE id = ?`,
        [title, description, languages, cardposterUrl, coverPageUrl, fristpostURL, secondpostURL, id],
        function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                res.json({ success: true });
            }
        });
});

// Delete a movie endpoint
app.delete('/api/moviesdata/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM acienma WHERE id = ?`, id, function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// Fetch all movies endpoint
// Existing route to get all movies
app.get('/api/moviesdata', (req, res) => {
    db.all(`SELECT * FROM acienma`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ moviedatas: rows });
        }
    });
});

// New route to get a specific movie by movieId
app.get('/api/moviesdata/title/:title', (req, res) => {
    const title = req.params.title;

    db.get(`SELECT * FROM acienma WHERE title = ?`, [title], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Movie not found' });
        } else {
            res.json(row);
        }
    });
});  

// Create theatre endpoint
app.post('/api/theatre', (req, res) => {
    const { theatrename, screennumber } = req.body;
    db.run(`INSERT INTO theatre (theatrename, screennumber) VALUES (?, ?)`, [theatrename, screennumber], function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// Edit theatre endpoint
app.put('/api/theatre/:id', (req, res) => {
    const { theatrename, screennumber } = req.body;
    const { id } = req.params;
    db.run(`UPDATE theatre SET theatrename = ?, screennumber = ? WHERE id = ?`,
        [theatrename, screennumber, id],
        function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                res.json({ success: true });
            }
        });
});

// Delete theatre endpoint
app.delete('/api/theatre/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM theatre WHERE id = ?`, id, function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// Fetch all theatres endpoint
app.get('/api/theatre', (req, res) => {
    db.all(`SELECT * FROM theatre`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ theatres: rows });
        }
    });
});

app.post('/api/booking',(req,res) =>{
    const {movietitle,
        date ,
        name ,
        seatno,theatre } = req.body;
    db.run(`INSERT INTO bbooking(movietitle,date,name,seatno,theatre) VALUES(?,?,?,?,?)`,
        [movietitle,date,name,seatno],
        function(err){
            if(err){
                res.status(500).json({success:false,error:err.message})
            }else{
                res.json({success:true});
            }
        })
})

app.get('/api/booking', (req, res) => {
    db.all(`SELECT * FROM bbooking`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ book: rows });
        }
    });
});

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
