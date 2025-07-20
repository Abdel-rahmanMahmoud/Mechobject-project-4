const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken); // All routes require authentication

router.get('/', favoriteController.getFavorites);
router.post('/', favoriteController.addToFavorites);
router.delete('/:productId', favoriteController.removeFromFavorites);

module.exports = router;