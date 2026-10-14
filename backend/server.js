require('dotenv').config();

const express = require('express');
const cors = require('cors'); 
const path = require('path');
const dashboardRoutes = require('./routes/dashboardRoutes');
const serviceRoutes = require('./routes/serviceRoutes'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Memasang rute pada jalur /api/
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});