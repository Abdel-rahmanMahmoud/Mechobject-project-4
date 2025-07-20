const express = require('express');
const multer = require('multer');
const productController = require('../controllers/productController');
const verifyToken = require('../middleware/verifyToken');
const allowRoles = require('../middleware/allowRoles');
const userRoles = require('../utils/userRoles');
const { productValidation, idParamValidation } = require('../middleware/validation');

const router = express.Router();

// Setup multer for product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split('/')[1];
    const fileName = `product-${Date.now()}.${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

// Public routes (no authentication required)
router.get('/', productController.getAllProducts);
router.get('/:id', idParamValidation, productController.getProductById);

// Admin only routes
router.post('/', 
  verifyToken, 
  allowRoles(userRoles.ADMIN), 
  upload.single('image'), 
  productValidation, 
  productController.createProduct
);

router.put('/:id', 
  verifyToken, 
  allowRoles(userRoles.ADMIN), 
  upload.single('image'), 
  idParamValidation, 
  productController.updateProduct
);

router.delete('/:id', 
  verifyToken, 
  allowRoles(userRoles.ADMIN), 
  idParamValidation, 
  productController.deleteProduct
);

module.exports = router;