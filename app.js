const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Tambahkan package 'cors'
const app = express();

const port = 3000;

// Middleware untuk parsing body dari request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware untuk mengizinkan akses dari berbagai domain (Cross-Origin Resource Sharing)
app.use(cors());

// Hubungkan ke MongoDB
mongoose.connect('mongodb+srv://fatwasembiring8:Kembaren_8@cluster0.f36seql.mongodb.net/capstoneBangkit', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });


  const userSchema = new mongoose.Schema({
    nama: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    tanggal_lahir: {
      type: Date,
      required: true
    }
  });
  
  const User = mongoose.model('User', userSchema);
  
  // Endpoint register
app.post('/register', (req, res) => {
    const { nama, email, password, tanggal_lahir } = req.body;
  
    // Cek apakah email sudah terdaftar
    User.findOne({ email: email })
      .then(user => {
        if (user) {
          return res.status(400).json({ message: 'Email sudah terdaftar!' });
        }
  
        // Buat objek pengguna baru
        const newUser = new User({
          nama,
          email,
          password,
          tanggal_lahir
        });
  
        // Simpan pengguna ke basis data
        newUser.save()
          .then(savedUser => {
            console.log('User added:', savedUser.email);
            return res.status(200).json({ message: 'Registrasi berhasil!', user: savedUser });
          })
          .catch(err => {
            console.error('Error saving user:', err);
            return res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan data pengguna!' });
          });
      })
      .catch(err => {
        console.error('Error checking user:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan saat memeriksa data pengguna!' });
      });
  });
  
  // Endpoint login
  app.post('/login', (req, res) => {
    const { email, password } = req.body;
  
    // Cari pengguna berdasarkan email
    User.findOne({ email: email })
      .then(user => {
        // Cek apakah pengguna ditemukan dan password cocok
        if (user && user.password === password) {
          return res.status(200).json({ message: 'Login berhasil!' });
        }
  
        return res.status(401).json({ message: 'Email atau password salah!' });
      })
      .catch(err => {
        console.error('Error finding user:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan saat mencari data pengguna!' });
      });
  });
  
  // Endpoint reset password
  app.post('/reset-password', (req, res) => {
    const { email } = req.body;
  
    // Cari pengguna berdasarkan email
    User.findOne({ email: email })
      .then(user => {
        if (user) {
          // Kirim email dengan tautan reset password (implementasi sesungguhnya diperlukan)
          return res.status(200).json({ message: 'Email untuk reset password telah dikirim!' });
        }
  
        return res.status(404).json({ message: 'Email tidak ditemukan!' });
      })
      .catch(err => {
        console.error('Error finding user:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan saat mencari data pengguna!' });
      });
  });
  
  // Endpoint untuk melihat daftar pengguna terdaftar
  app.get('/users', (req, res) => {
    User.find()
      .then(users => {
        return res.status(200).json(users);
      })
      .catch(err => {
        console.error('Error retrieving users:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data pengguna!' });
      });
  });
  
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });