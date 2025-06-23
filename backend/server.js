const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./src/routes/auth');
const companyRoutes = require('./src/routes/company');
const receiverRoutes = require('./src/routes/receiver');
const productRoutes = require('./src/routes/product');
const billRoutes = require('./src/routes/bill');
const analyticsRoutes = require('./src/routes/analytics');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
// app.use(cors({
//   origin: "https://6859567b717bf20009f475c5--mellow-moxie-829df5.netlify.app", // or "*" for open
//   credentials: true
// }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://6859567b717bf20009f475c5--mellow-moxie-829df5.netlify.app',
    'https://685972c55838190008a01c5a--mellow-moxie-829df5.netlify.app', // add your new deploy preview
    // or use a wildcard for all Netlify previews:
    // /^https:\\/\\/[a-z0-9-]+--mellow-moxie-829df5\\.netlify\\.app$/
  ],
  credentials: true,
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// MongoDB connection
// mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('MongoDB connected'))
// .catch((err) => console.error('MongoDB connection error:', err));

// ✅ Recommended: Simplified connection
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get('/', (req, res) => {
  res.send('GST Bill App Backend Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/receiver', receiverRoutes);
app.use('/api/product', productRoutes);
app.use('/api/bill', billRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/bills', express.static(path.join(__dirname, 'public/bills')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
