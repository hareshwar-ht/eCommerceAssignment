const userModel = require('../models/userModel');
const refreshTokenModel = require('../models/refreshTokenModel');
const authService = require('../services/authService');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const normalizePhone = (phone) => {
  if (!phone) return phone;
  let cleaned = phone.replace(/[\s()-]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
      cleaned = `+91${cleaned}`;
    } else if (cleaned.startsWith('91') && cleaned.length === 12 && /^\d+$/.test(cleaned)) {
      cleaned = `+${cleaned}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }
  return cleaned;
};

const register = async (req, res) => {
  try {
    let { name, email, password, phone } = req.body;
    phone = normalizePhone(phone);

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone number are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    const { user, accessToken, refreshToken } = await authService.registerDirectly({ name, email, password, phone });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_MS),
      path: '/api/user/refresh',
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        accessToken,
      },
    });
  } catch (err) {
    if (err.message === 'User with this email already exists.') {
      return res.status(409).json({ success: false, message: err.message });
    }
    logger.error('Register error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const registerInitiate = async (req, res) => {
  try {
    let { name, email, password, phone } = req.body;
    phone = normalizePhone(phone);

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone number are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    await authService.initiateRegistration({ name, email, password, phone });

    res.status(200).json({
      success: true,
      message: 'OTP sent to mobile number. Please verify.',
    });
  } catch (err) {
    if (err.message === 'User with this email already exists.') {
      return res.status(409).json({ success: false, message: err.message });
    }
    logger.error('Register initiate error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const registerVerify = async (req, res) => {
  try {
    let { phone, otp } = req.body;
    phone = normalizePhone(phone);

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required.',
      });
    }

    const { user, accessToken, refreshToken } = await authService.verifyRegistration({ phone, otp });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_MS),
      path: '/api/user/refresh',
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        accessToken,
      },
    });
  } catch (err) {
    if (err.message === 'No active OTP verification session found for this phone number.' || err.message === 'Invalid OTP.') {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.message === 'User with this email already exists.') {
      return res.status(409).json({ success: false, message: err.message });
    }
    logger.error('Register verify error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const { user, accessToken, refreshToken } = await authService.login({ email, password });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_MS),
      path: '/api/user/refresh',
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        accessToken,
      },
    });
  } catch (err) {
    if (err.message === 'Invalid email or password.') {
      return res.status(401).json({ success: false, message: err.message });
    }
    logger.error('Login error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing.',
      });
    }

    let payload;
    try {
      payload = require('../utils/jwt').verifyRefreshToken(token);
    } catch {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token.',
      });
    }

    const storedTokens = await refreshTokenModel.findByUserId(payload.sub);
    if (!storedTokens.length) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token not found.',
      });
    }

    let matchedToken = null;
    for (const stored of storedTokens) {
      const valid = await refreshTokenModel.verifyToken(token, stored.token_hash);
      if (valid) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      await refreshTokenModel.deleteByUserId(payload.sub);
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token. All sessions revoked.',
      });
    }

    await refreshTokenModel.deleteByUserId(payload.sub);

    const user = await userModel.findById(payload.sub);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await refreshTokenModel.create(user.id, newRefreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRES_MS),
      path: '/api/user/refresh',
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (err) {
    logger.error('Refresh error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await userModel.saveResetToken(email, resetToken, expiresAt);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send resetUrl via email or SMS depending on standard practice
    logger.info(`Password reset URL: ${resetUrl}`);

    res.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
      data: {
        resetUrl,
      },
    });
  } catch (err) {
    logger.error('Forgot password error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const user = await userModel.findByResetToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    await userModel.updatePassword(user.id, newPassword);
    await refreshTokenModel.deleteByUserId(user.id);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/api/user/refresh',
    });

    res.json({
      success: true,
      message: 'Password reset successful. Please login again.',
    });
  } catch (err) {
    logger.error('Reset password error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      try {
        const payload = require('../utils/jwt').verifyRefreshToken(token);
        await refreshTokenModel.deleteByUserId(payload.sub);
      } catch {
        await refreshTokenModel.deleteAllExpired();
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/api/user/refresh',
    });

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    logger.error('Logout error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (err) {
    logger.error('Get profile error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required.',
      });
    }

    const updatedUser = await userModel.updateProfile(req.user.sub, { name, email, phone });
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedUser },
    });
  } catch (err) {
    logger.error('Update profile error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const deleteProfile = async (req, res) => {
  try {
    await userModel.deleteProfile(req.user.sub);
    res.clearCookie('refreshToken', { path: '/api/user/refresh' });
    res.json({
      success: true,
      message: 'Profile deleted successfully.',
    });
  } catch (err) {
    logger.error('Delete profile error: ' + err);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

module.exports = {
  register,
  registerInitiate,
  registerVerify,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
  updateProfile,
  deleteProfile,
};
