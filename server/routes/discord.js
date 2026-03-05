// server/routes/discord.js
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('../db/models');
const logger = require('../utils/logger');

const router = express.Router();

// Generate Discord OAuth URL
router.get('/auth-url', (req, res) => {
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
  const state = req.query.userId; // Pass user ID as state for security

  if (!state) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
    state: state, // We'll verify this on callback
  });

  const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  res.json({ url: authUrl });
});

// Discord OAuth callback
router.get('/callback', async (req, res) => {
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.redirect(`${FRONTEND_URL}/user/${userId || ''}?discord_error=missing_params`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // Get Discord user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const discordUser = userResponse.data;
    const discordUserId = discordUser.id;
    const discordUsername = discordUser.username;
    const discordDiscriminator = discordUser.discriminator;
    const discordAvatar = discordUser.avatar;

    // Check if this Discord account is already linked to another user
    const existingLink = await User.findOne({ where: { discordUserId } });
    if (existingLink && existingLink.id !== parseInt(userId)) {
      return res.redirect(
        `${FRONTEND_URL}/user/${userId}?discord_error=already_linked&linked_to=${
          existingLink.displayName || existingLink.username
        }`
      );
    }

    // Update user with Discord info
    const user = await User.findByPk(userId);
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/user/${userId}?discord_error=user_not_found`);
    }

    // Store Discord info
    await user.update({
      discordUserId: discordUserId,
      discordUsername: discordUsername,
      discordAvatar: discordAvatar,
    });

    // Redirect back to user profile with success
    res.redirect(
      `${FRONTEND_URL}/user/${userId}?discord_linked=true&discord_username=${encodeURIComponent(
        discordUsername
      )}`
    );
  } catch (error) {
    logger.error('Discord OAuth error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/user/${userId}?discord_error=auth_failed`);
  }
});

// Verify Discord link status (optional API endpoint)
router.get('/status/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      linked: !!user.discordUserId,
      discordUserId: user.discordUserId,
      discordUsername: user.discordUsername,
      discordAvatar: user.discordAvatar,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check Discord status' });
  }
});

module.exports = router;
