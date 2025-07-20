const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { sequelize } = require('./models');
const httpStatusText = require('./utils/httpStatusText');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const contactRoutes = require('./routes/contactRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();

sequelize.authenticate()
  .then(() => {
    console.log('MySQL database connected successfully');
  })
  .catch(err => {
    console.error('Unable to connect to MySQL database:', err);
    process.exit(1);
  });

app.use(cors({
  origin: process.env.FRONTEND_URL ,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/cart', cartRoutes);

app.all('*', (req, res, next) => {
  return res.status(404).json({
    status: httpStatusText.Error,
    message: 'This resource is not available'
  });
});

app.use((err, req, res, next) => {
  console.log('Error:', err);
  res.status(err.statusCode || 500).json({
    statusText: err.statusTxt || httpStatusText.Error,
    message: err.message || 'Internal Server Error',
    code: err.statusCode || 500
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});