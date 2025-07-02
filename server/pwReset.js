const bcrypt = require('bcryptjs');

const newPassword = '';
const saltRounds = 10;

bcrypt.hash(newPassword, saltRounds, (err, hash) => {
  if (err) throw err;

  console.log('New hashed password:', hash);
});
