const { 
        registerUser, 
        loginUser, 
        resetPassword, 
        getUsers }
        = require('./handler.js');

const routes = [
  {
    method: 'POST',
    path: '/register',
    handler: registerUser
  },
  {
    method: 'POST',
    path: '/login',
    handler: loginUser
  },
  {
    method: 'POST',
    path: '/reset-password',
    handler: resetPassword
  },
  {
    method: 'GET',
    path: '/users',
    handler: getUsers
  },
  {
    method: '*',
    path: '/',
    handler: (request, h) => {
      return 'Halaman tidak dapat diakses dengan method tersebut';
    }
  },
  {
    method: '*',
    path: '/{any*}',
    handler: (request, h) => {
      return 'Halaman tidak ditemukan';
    }
  }
];

module.exports = routes;