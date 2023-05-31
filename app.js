const express = require('express');
const fs = require('fs');
const app = express();

const port = 3000;

// Baca data pengguna dari file users.json
let users = [];

function readUsersFromFile() {
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading users file:', err);
            return;
        }
        users = JSON.parse(data);
        console.log('Users loaded');
    });
}

readUsersFromFile();

// Middleware untuk mengizinkan permintaan JSON
app.use(express.json());

// Endpoint register
app.post('/register', (req, res) => {
    const { nama, email, password, tanggal_lahir } = req.body;

    // Cek apakah email sudah terdaftar
    if (users.some(user => user.email === email)) {
        return res.status(400).json({ message: 'Email sudah terdaftar!' });
    }

    // Buat objek pengguna baru
    const user = {
        nama,
        email,
        password,
        tanggal_lahir
    };

    // Simpan pengguna ke basis data
    users.push(user);

    // Simpan perubahan ke file users.json (jika menggunakan penyimpanan berbasis file)
    fs.writeFile('users.json', JSON.stringify(users), 'utf8', err => {
        if (err) {
            console.error('Error writing users file:', err);
            return res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan data pengguna!' });
        }
        console.log('User added:', user.email);
        return res.status(200).json({ message: 'Registrasi berhasil!', user });
    });
});

// Endpoint login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Cari pengguna berdasarkan email
    const user = users.find(user => user.email === email);

    // Cek apakah pengguna ditemukan dan password cocok
    if (user && user.password === password) {
        return res.status(200).json({ message: 'Login berhasil!' });
    }

    return res.status(401).json({ message: 'Email atau password salah!' });
});

// Endpoint reset password
app.post('/reset-password', (req, res) => {
    const { email } = req.body;

    // Cari pengguna berdasarkan email
    const user = users.find(user => user.email === email);

    if (user) {
        // Kirim email dengan tautan reset password (implementasi sesungguhnya diperlukan)
        return res.status(200).json({ message: 'Email untuk reset password telah dikirim!' });
    }

    return res.status(404).json({ message: 'Email tidak ditemukan!' });
});

// Endpoint untuk melihat daftar pengguna terdaftar
app.get('/users', (req, res) => {
    return res.status(200).json(users);
});

// Jalankan server pada port 3000
app.listen(port, () => {
    console.log(`Server berjalan pada port ${port}`);
});
