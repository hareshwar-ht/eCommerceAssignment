const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userModel = require('../models/userModel');
const refreshTokenModel = require('../models/refreshTokenModel');
const pendingRegistrationModel = require('../models/pendingRegistrationModel');
const notificationService = require('./notificationService');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const pool = require('../config/database');

const initiateRegistration = async ({ name, email, password, phone }) => {
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = notificationService.generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pendingRegistrationModel.create(name, email, passwordHash, phone, otp, expiresAt);

  try {
    await notificationService.queueNotification({
      type: 'sms',
      userId: null,
      recipient: phone,
      templateName: 'SMS_OTP_REGISTER',
      payload: {
        body: `Your verification OTP is: ${otp}. Valid for 10 minutes.`,
        otp,
        name,
      },
    });
  } catch (err) {
    logger.error('Failed to queue OTP SMS: ' + err.message);
  }
};

const verifyRegistration = async ({ phone, otp }) => {
  const pending = await pendingRegistrationModel.findLatestByPhone(phone);
  if (!pending) {
    throw new Error('No active OTP verification session found for this phone number.');
  }

  if (pending.otp !== otp) {
    throw new Error('Invalid OTP.');
  }

  const existingUser = await userModel.findByEmail(pending.email);
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  let user = null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const insertRes = await client.query(
      `INSERT INTO users (name, email, password_hash, phone, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, phone, role, created_at`,
      [pending.name, pending.email, pending.password_hash, pending.phone, 'user']
    );
    user = insertRes.rows[0];

    await client.query('DELETE FROM pending_registrations WHERE phone = $1', [phone]);
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await refreshTokenModel.create(user.id, refreshToken);

  try {
    await notificationService.queueNotification({
      type: 'email',
      userId: user.id,
      recipient: user.email,
      templateName: 'register-success',
      payload: {
        name: user.name,
        login_url: `/login`,
      },
    });
  } catch (err) {
    logger.error('Failed to queue registration email: ' + err.message);
  }

  return { user, accessToken, refreshToken };
};

const registerDirectly = async ({ name, email, password, phone }) => {
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const user = await userModel.create({ name, email, password, phone });
  const otp = phone ? notificationService.generateOTP() : null;

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await refreshTokenModel.create(user.id, refreshToken);

  if (phone) {
    try {
      await notificationService.queueNotification({
        type: 'sms',
        userId: user.id,
        recipient: phone,
        templateName: 'SMS_OTP_REGISTER',
        payload: {
          body: `Your verification OTP is: ${otp}. Valid for 10 minutes.`,
          otp,
          name: user.name,
        },
      });
    } catch (err) {
      logger.error('Failed to queue OTP SMS: ' + err.message);
    }
  }

  try {
    await notificationService.queueNotification({
      type: 'email',
      userId: user.id,
      recipient: email,
      templateName: 'register-success',
      payload: {
        name: user.name,
        login_url: `/login`,
      },
    });
  } catch (err) {
    logger.error('Failed to queue registration email: ' + err.message);
  }

  return { user, accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isPasswordValid = await userModel.verifyPassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await refreshTokenModel.create(user.id, refreshToken);

  return { user, accessToken, refreshToken };
};

module.exports = {
  initiateRegistration,
  verifyRegistration,
  registerDirectly,
  login,
};
