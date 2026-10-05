require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/content', require('./routes/content'));
app.use('/api/content', require('./routes/download'));
app.use('/api/admin/auth', require('./routes/admin-auth'));
app.use('/api/admin/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NEXORA démarré sur le port ${PORT}`);
});
