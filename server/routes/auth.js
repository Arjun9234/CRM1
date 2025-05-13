const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { getAuth } = require('firebase-admin/auth'); // For Firebase Admin SDK

// Initialize Firebase Admin SDK (ensure this is done once, typically in server.js or a config file)
// For this example, assuming it's initialized elsewhere and `getAuth()` can be used.
// If not, you'd need:
// const admin = require('firebase-admin');
// const serviceAccount = require('path/to/your/serviceAccountKey.json'); // Securely manage this
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });


// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, image, bio, company } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      image: image || `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100`,
      bio,
      company
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }, // Token expires in 5 hours
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error('Register error:', err.message);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: err.errors });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token (Login)
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials (user not found)' });
    }
    
    if (!user.password && user.googleId) { // User registered via Google and has no local password
        return res.status(400).json({ message: 'Please sign in using Google.' });
    }
    if (!user.password) { // User has no password and no googleId (edge case, should not happen with proper registration)
      return res.status(400).json({ message: 'Account error. Please contact support.'});
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials (password mismatch)' });
    }

    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio,
        company: user.company,
        createdAt: user.createdAt
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/google
// @desc    Authenticate user via Google Firebase ID token & get custom JWT
// @access  Public
router.post('/google', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No Firebase ID token provided or malformed header.' });
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    let user = await User.findOne({ email: email });

    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({
        googleId: uid,
        email: email,
        name: name || 'Google User', // Use name from Google or a default
        image: picture || `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100`,
        // Password field will be unset for Google users initially
      });
      await user.save();
    } else {
      // If user exists, ensure googleId is set (e.g., if they previously signed up with email/password)
      if (!user.googleId) {
        user.googleId = uid;
        if (name && !user.name) user.name = name; // Update name if not set
        if (picture && (!user.image || user.image.includes('picsum.photos'))) user.image = picture; // Update image if default or not set
        await user.save();
      }
    }

    // Generate your custom JWT
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio,
        company: user.company,
        createdAt: user.createdAt,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );
  } catch (error) {
    console.error('Google Sign-In error (backend):', error.message, error.code);
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ message: 'Firebase ID token has expired. Please sign in again.' });
    }
    if (error.code === 'auth/argument-error') {
        return res.status(401).json({ message: 'Firebase ID token is invalid or malformed.' });
    }
    res.status(401).json({ message: 'Google Sign-In failed. Unable to verify token.' });
  }
});


module.exports = router;
