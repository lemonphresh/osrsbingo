'use strict';

const express = require('express');
const {
  getSoloBossMap,
  getRaidMap,
  getSkillMap,
  getMinigameMap,
  getClueMap,
  getGroupDashboardBossOptions,
  getGroupDashboardSkillOptions,
  getGroupDashboardClueOptions,
  getGroupDashboardActivityOptions,
} = require('../utils/contentRegistry');

const router = express.Router();

// Pre-compute at module load — data is static at runtime.
const payload = JSON.stringify({
  soloBosses: getSoloBossMap(),
  raids:      getRaidMap(),
  skills:     getSkillMap(),
  minigames:  getMinigameMap(),
  clueTiers:  getClueMap(),
  // Group dashboard metric selectors — full WOM metric space, not filtered for events
  groupDashboard: {
    bossOptions:     getGroupDashboardBossOptions(),
    skillOptions:    getGroupDashboardSkillOptions(),
    clueOptions:     getGroupDashboardClueOptions(),
    activityOptions: getGroupDashboardActivityOptions(),
  },
});

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(payload);
});

module.exports = router;
