import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  const users = await User.find().sort({ createdAt: -1 }).limit(5);
  console.log('Last 5 users:');
  users.forEach(u => {
    console.log(`- ${u.name} | Email: ${u.email} | Role: "${u.role}" | ID: ${u._id}`);
  });
  mongoose.disconnect();
})
.catch(err => console.error(err));
