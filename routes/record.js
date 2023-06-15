const bodyParser = require('body-parser')
const express = require('express')
const mysql = require('mysql')
const router = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const multer = require("multer");

// TODO: Sesuaikan konfigurasi database
const connection = mysql.createConnection({
    host: '34.101.106.158',
    user: 'root',
    database: 'sqlcaps01',
    password: 'sqlcaps01'
})
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage: storage }).any();

router.get("/users", (req, res) => {
    const query = "SELECT * FROM users"
    connection.query(query, (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage })
        } else {
            res.json(rows)
        }
    })
})

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT * FROM users WHERE email = ?";
    connection.query(query, [email], (err, rows) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else if (rows.length === 0) {
            res.status(404).send({ message: "User not found" });
        } else {
            const user = rows[0];
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) {
                    res.status(500).send({ message: "Password comparison failed" });
                } else if (result) {
                    // Generate a token
                    const token = jwt.sign({ email: user.email, userId: user.id }, "your-secret-key");

                    // Send the token as a response
                    res.status(200).send({ message: "Login successful", token });
                } else {
                    res.status(401).send({ message: "Invalid password" });
                }
            });
        }
    });
});
router.post('/register', (req, res) => {
    const { nama, email, password, tanggal_lahir } = req.body;

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            res.status(500).send({ message: "Password encryption failed" });
        } else {
            const query = 'INSERT INTO users (nama, email, password, tanggal_lahir) VALUES (?, ?, ?, ?)';
            connection.query(query, [nama, email, hashedPassword, tanggal_lahir], (err, result) => {
                if (err) {
                    res.status(500).send({ message: err.sqlMessage });
                } else {
                    res.status(201).send({ message: 'User inserted successfully', insertId: result.insertId });
                }
            });
        }
    });
})

// Get user by ID
router.get("/users/:id", (req, res) => {
    const userId = req.params.id;
    const query = "SELECT * FROM users WHERE id = ?";
    connection.query(query, [userId], (err, rows) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else if (rows.length === 0) {
            res.status(404).send({ message: "User not found" });
        } else {
            const user = rows[0];
            res.status(200).send(user);
        }
    });
});

// Change user password
router.put("/users/:id/password", (req, res) => {
    const userId = req.params.id;
    const newPassword = req.body.newPassword;

    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
            res.status(500).send({ message: "Password encryption failed" });
        } else {
            const query = "UPDATE users SET password = ? WHERE id = ?";
            connection.query(query, [hashedPassword, userId], (err, result) => {
                if (err) {
                    res.status(500).send({ message: err.sqlMessage });
                } else {
                    res.status(200).send({ message: "Password updated successfully" });
                }
            });
        }
    });
});

// Mengambil data Penyakit Kulit 
router.get("/skinDisease/:id", (req, res) => {
    const diseaseId = req.params.id;
    const query = "SELECT * FROM skinDisease WHERE id = ?";
    connection.query(query, [diseaseId], (err, rows) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else if (rows.length === 0) {
            res.status(404).send({ message: "Penyakit kulit tidak ditemukan" });
        } else {
            const disease = rows[0];
            res.status(200).send(disease);
        }
    });
});

//API untuk mengunggah gambar
router.post("/uploadImage", verifyToken, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).send({ message: "Gagal mengunggah gambar" });
        } else {
            const idUsers = req.user.userId; // Menggunakan id pengguna yang mengunggah gambar
            const gambar = req.files[0].filename;

            const query = "INSERT INTO inputUsers (idUsers, gambar) VALUES (?, ?)";
            connection.query(query, [idUsers, gambar], (err, result) => {
                if (err) {
                    res.status(500).send({ message: err.sqlMessage });
                } else {
                    res.status(201).send({ message: "Gambar berhasil diunggah", insertId: result.insertId });
                }
            });
        }
    });
});

function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        res.status(401).send({ message: "Unauthorized" });
    } else {
        jwt.verify(token, "your-secret-key", (err, decoded) => {
            if (err) {
                res.status(401).send({ message: "Invalid token" });
            } else {
                req.user = decoded;
                next();
            }
        });
    }
}



module.exports = router;
