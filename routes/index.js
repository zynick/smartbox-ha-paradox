const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.render('index', { title: 'Home Assistant - Paradox API' });
});

module.exports = router;
