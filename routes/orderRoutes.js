const express = require('express');
const router = express.Router();
const Order = require('../models/order'); // Assuming you have an Order model

// Store a new order
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

router.post('/place', async (req, res) => {
    try {
        const { customerId, customerName, email, items, totalPrice } = req.body;

        if (!customerId || !customerName || !email || !items || !totalPrice) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Items should be a non-empty array' });
        }

        // Check if customerId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ success: false, message: 'Invalid customerId format' });
        }

        // Map items array and validate productId
        const mappedItems = items.map(item => ({
            productId: mongoose.Types.ObjectId.isValid(item.productId) ? new mongoose.Types.ObjectId(item.productId) : null,
            itemName: item.itemName,
            quantity: item.quantity
        }));

        // Validate productId conversion
        if (mappedItems.some(item => item.productId === null)) {
            return res.status(400).json({ success: false, message: 'Invalid productId format' });
        }

        const newOrder = new Order({
            customerId: customerId,  // Adding the customerId
            customerName,
            email,
            items: mappedItems,
            totalPrice,
            status: 'pending'
        });

        await newOrder.save();
        res.status(201).json({ success: true, message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



// Get all orders
router.get('/all', async (req, res) => {
    try {
        const orders = await Order.find().populate('items.productId');
        res.json(orders); // Return only the array
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



// Get orders of an individual user by email
router.get('/user/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const userOrders = await Order.find({ email }).populate('items.productId');

        if (userOrders.length === 0) {
            return res.status(404).json({ success: false, message: 'No orders found for this user' });
        }

        res.json({ success: true, orders: userOrders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



// Get order details
router.get('/details/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate('items.productId');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update order status
router.put('/update/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // Find and update the order
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, message: 'Order status updated successfully', order: updatedOrder });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;