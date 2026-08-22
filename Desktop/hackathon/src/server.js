require('dotenv').config();
const express = require('express');
const cors = require('cors');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/complaints', complaintRoutes);
app.get('/health', (req, res) => res.json({ status: 'API is running' }));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));