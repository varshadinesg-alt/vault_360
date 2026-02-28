// Ensure you have these imports at the top
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// UPDATE PRODUCT ROUTE
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      { name, price, stock }, 
      { new: true }
    );
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// DELETE PRODUCT ROUTE
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});
