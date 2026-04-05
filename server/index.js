import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

import donationRoutes from './routes/donationRoutes.js';

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

app.use(cors());
app.use(express.json());
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

  app.get(/.*/, (req, res) =>
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));
