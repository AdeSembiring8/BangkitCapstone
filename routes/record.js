const bodyParser = require('body-parser')
const express = require('express')
const mysql = require('mysql')
const router = express.Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const multer = require("multer");
const { Storage } = require('@google-cloud/storage');

// TODO: Sesuaikan konfigurasi database
const connection = mysql.createConnection({
    host: '34.101.106.158',
    user: 'root',
    database: 'sqlcaps01',
    password: 'sqlcaps01'
})

//Bucket 
const storage = new Storage({
    projectId: 'moonlit-balm-389714',
    keyFilename: 'key2.json'
});
const bucketName = 'caps01/uploads/';
const bucket = storage.bucket(bucketName);

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage }).any();

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
                    res.status(200).send({ message: "Login successful", token, userId: user.id });
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

router.get("/allskinDisease", (req, res) => {
    const query = "SELECT * FROM skinDisease";
    connection.query(query, (err, result) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
            console.log(err);
        } else {
            res.status(200).send({ diseases: result });
        }
    });
});

//API untuk mengunggah gambar

  
router.post("/uploadImage", verifyToken, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).send({ message: "Gagal mengunggah gambar" });
            console.log(err);
        } else {
            const idUsers = req.user.userId;
            const files = req.files;

            if (!files || files.length === 0) {
                res.status(400).send({ message: "Tidak ada gambar yang diunggah" });
                return;
            }

            const filePromises = files.map((file) => {
                const fileName = file.filename;
                const fileBuffer = file.buffer;

                const blob = bucket.file(fileName);
                const blobStream = blob.createWriteStream({
                    resumable: false,
                    public: true
                });

                return new Promise((resolve, reject) => {
                    blobStream.on('error', (err) => {
                        console.log(err);
                        reject(err);
                    });

                    blobStream.on('finish', () => {
                        resolve(fileName);
                    });

                    blobStream.end(fileBuffer);
                });
            });

            Promise.all(filePromises)
                .then((fileNames) => {
                    // Simpan informasi gambar ke MySQL
                    const query = "INSERT INTO inputUsers (idUsers, gambar) VALUES (?, ?)";
                    const insertValues = fileNames.map((fileName) => [idUsers, fileName]);

                    connection.query(query, [insertValues], (err, result) => {
                        if (err) {
                            console.log(err);
                            res.status(500).send({ message: err.sqlMessage });
                        } else {
                            res.status(201).send({ message: "Gambar berhasil diunggah", insertId: result.insertId });
                        }
                    });
                })
                .catch((err) => {
                    res.status(500).send({ message: "Gagal mengunggah gambar" });
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

//History untuk semua penyakit
router.get("/uploadHistory", verifyToken, (req, res) => {
    const idUsers = req.user.userId;

    const query = "SELECT gambar FROM inputUsers WHERE idUsers = ?";
    connection.query(query, [idUsers], (err, result) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            res.status(200).send({ history: result });
        }
    });
});

// Fitur Search Mas
router.get("/skinDiseases/search", (req, res) => {
    const searchTerm = req.query.searchTerm;
    const query = "SELECT * FROM skinDisease WHERE namaPenyakit LIKE ? OR deskripsi LIKE ?";
    const searchValue = "%" + searchTerm + "%";

    connection.query(query, [searchValue, searchValue], (err, result) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            res.status(200).send({ diseases: result });
        }
    });
});


module.exports = router;
