const { Favorite, Product } = require('../models');
const httpStatusText = require('../utils/httpStatusText');
const asyncWrapper = require('../middleware/asyncWrapper');
const appError = require('../utils/appError');

// Get user favorites
const getFavorites = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.userId;
  
  const favorites = await Favorite.findAll({
    where: { userId },
    include: [{
      model: Product,
      as: 'product'
    }]
  });

  res.json({
    status: httpStatusText.Success,
    data: { favorites }
  });
});

// Add to favorites
const addToFavorites = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.userId;
  const { productId } = req.body;

  // Check if product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    return next(appError.createError('Product not found', 404, httpStatusText.Fail));
  }

  // Check if already in favorites
  const existingFavorite = await Favorite.findOne({
    where: { userId, productId }
  });

  if (existingFavorite) {
    return next(appError.createError('Product already in favorites', 400, httpStatusText.Fail));
  }

  const favorite = await Favorite.create({ userId, productId });

  res.status(201).json({
    status: httpStatusText.Success,
    data: { favorite }
  });
});

// Remove from favorites
const removeFromFavorites = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.userId;
  const { productId } = req.params;

  const favorite = await Favorite.findOne({
    where: { userId, productId }
  });

  if (!favorite) {
    return next(appError.createError('Favorite not found', 404, httpStatusText.Fail));
  }

  await favorite.destroy();

  res.json({
    status: httpStatusText.Success,
    message: 'Removed from favorites'
  });
});

module.exports = {
  getFavorites,
  addToFavorites,
  removeFromFavorites
};