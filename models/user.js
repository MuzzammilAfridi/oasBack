const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: String,
    address: { type: mongoose.Schema.Types.ObjectId, ref: "Address" }, // Reference to Address model
});

module.exports = mongoose.model("User", userSchema);
