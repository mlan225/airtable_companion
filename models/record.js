var mongoose = require('mongoose');

var RecordSchema = new mongoose.Schema({
    title: String,
    recent_activity: String,
    is_new: Boolean,
});

module.exports = mongoose.model('Record', RecordSchema);