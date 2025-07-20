const { validationResult } = require('express-validator');
const { Product } = require('../models');
const httpStatusText = require('../utils/httpStatusText');
const asyncWrapper = require('../middleware/asyncWrapper');
const appError = require('../utils/appError');

const formatErrors = (errors) =>
  errors.array().map((error) => ({
    [`error of ${error.path}`]: error.msg
  }));

const getAllProducts = asyncWrapper(async (req, res, next) => {
  const { category, page = 1, limit = 4 } = req.query;
  const offset = (page - 1) * limit;
  
  const whereClause = category ? { category } : {};
  
  const { count, rows: products } = await Product.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    status: httpStatusText.Success,
    data: {
      products,
      totalProducts: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    }
  });
});

const getProductById = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      appError.createError(formatErrors(errors), 400, httpStatusText.Fail)
    );
  }

  const product = await Product.findByPk(req.params.id);
  if (!product) {
    return next(
      appError.createError('Product not found', 404, httpStatusText.Fail)
    );
  }

  res.json({
    status: httpStatusText.Success,
    data: { product }
  });
});

const createProduct = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      appError.createError(formatErrors(errors), 400, httpStatusText.Fail)
    );
  }

  const { name, description, price, category, stock } = req.body;
  
  const newProduct = await Product.create({
    name,
    description,
    price,
    category,
    stock: stock || 0,
    image: req.file ? req.file.filename : null
  });

  res.status(201).json({
    status: httpStatusText.Success,
    data: { product: newProduct }
  });
});

const updateProduct = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      appError.createError(formatErrors(errors), 400, httpStatusText.Fail)
    );
  }

  const product = await Product.findByPk(req.params.id);
  if (!product) {
    return next(
      appError.createError('Product not found', 404, httpStatusText.Fail)
    );
  }

  const updateData = { ...req.body };
  if (req.file) {
    updateData.image = req.file.filename;
  }

  await product.update(updateData);

  res.json({
    status: httpStatusText.Success,
    data: { product }
  });
});

const deleteProduct = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      appError.createError(formatErrors(errors), 400, httpStatusText.Fail)
    );
  }

  const product = await Product.findByPk(req.params.id);
  if (!product) {
    return next(
      appError.createError('Product not found', 404, httpStatusText.Fail)
    );
  }

  await product.destroy();

  res.json({
    status: httpStatusText.Success,
    message: 'Product deleted successfully'
  });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};