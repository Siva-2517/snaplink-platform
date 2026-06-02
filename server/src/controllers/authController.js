const User = require('../models/User');
const jwt = require('jsonwebtoken');


const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'developer-glowing-secret-key-for-local-use',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};


const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password.' });
    }

    // Check if user already exists
    const userByEmail = await User.findOne({ email: email.toLowerCase() });
    if (userByEmail) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ success: false, message: 'This username is already taken.' });
    }

    // Create user (hashing is handled pre-save in User model)
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};


const getMe = async (req, res) => {
  try {
    // req.user is loaded in protect middleware
    return res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('getMe Error:', error);
    return res.status(500).json({ success: false, message: 'Server error loading profile.' });
  }
};

module.exports = {
  signup,
  login,
  getMe
};
