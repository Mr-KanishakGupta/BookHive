const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.warn("Could not find serviceAccountKey.json locally. Looking for environment variables.");
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized via local JSON file.");
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
    console.log("Firebase Admin initialized via Render Environment Variable.");
} else {
    console.error("FATAL: No Firebase Admin credentials found.");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const cronRoutes = require('./routes/cron');

app.use('/api/auth', authRoutes);
app.use('/api/cron', cronRoutes);

app.get('/', (req, res) => {
    res.send('BookHive Express API is running.');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
