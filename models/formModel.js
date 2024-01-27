const mongoose = require('mongoose');
const formSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    query: { type: String, required: true }
}, { timestamps: true });
const formModel = mongoose.model("forms", formSchema);
module.exports = formModel;