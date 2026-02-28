const mongoose = require('mongoose');

// This is the blueprint for every product in your store
const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Please enter product name"] 
  },
  description: { 
    type: String, 
    required: [true, "Please enter product description"] 
  },
  price: { 
    type: Number, 
    required: [true, "Please enter product price"],
    default: 0 
  },
  image: { 
    type: String, // This will be a URL to the image
    required: true 
  },
  category: { 
    type: String, 
    required: [true, "Please select category"] 
  },
  countInStock: { 
    type: Number, 
    required: true, 
    default: 0 
  }
}, { 
  timestamps: true // This automatically adds 'createdAt' and 'updatedAt' fields
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;