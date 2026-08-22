require('dotenv').config();
const express = require('express');
const cors = require('cors');
const complaintRoutes = require('./routes/complaintRoutes');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '../public')));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/complaints', complaintRoutes);
app.get('/health', (req, res) => res.json({ status: 'API is running' }));


// Send all /api/complaints traffic to our new router
app.use('/api/complaints', complaintRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));