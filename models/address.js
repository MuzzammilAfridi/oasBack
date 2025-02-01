const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zip: String,
});

module.exports = mongoose.model("Address", addressSchema);
