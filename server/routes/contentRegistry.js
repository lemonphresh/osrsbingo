'use strict';

const express = require('express');
const {
  getSoloBossMap,
  getRaidMap,
  getSkillMap,
  getMinigameMap,
  getClueMap,
} = require('../utils/contentRegistry');

const router = express.Router();

// Pre-compute at module load — data is static at runtime.
const payload = JSON.stringify({
  soloBosses: getSoloBossMap(),
  raids:      getRaidMap(),
  skills:     getSkillMap(),
  minigames:  getMinigameMap(),
  clueTiers:  getClueMap(),
});

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(payload);
});

module.exports = router;
