const express = require('express');
const app = express();
const router = require('./routes');

app.use(express.json());

const { registerUser, loginUser, resetPassword, getUsers } = require('./handler.js');

app.post('/register', registerUser);
app.post('/login', loginUser);
app.post('/reset-password', resetPassword);
app.get('/users', getUsers);

app.all('/', (req, res) => {
  return res.status(405).send('Halaman tidak dapat diakses dengan method tersebut');
});

app.all('*', (req, res) => {
  return res.status(404).send('Halaman tidak ditemukan');
});

module.exports = app;