const mongoose = require('mongoose');
const User = require('../backend/src/models/User');
require('dotenv').config({ path: '../backend/.env' });

async function check() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected!');
  
  const user = await User.findOne({ employeeId: 'EMP001' });
  if (user) {
    console.log(`User found! Name: ${user.name}, Email: ${user.email}, Status: ${user.status}`);
  } else {
    console.log('User EMP001 not found in database!');
  }
  process.exit(0);
}

check().catch(err => {
  console.error('Database connection error:', err.message);
  process.exit(1);
});
