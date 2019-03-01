var mongoose = require('mongoose');

var RecordSchema = new mongoose.Schema({
    title: String,
    recent_activity: String,
});

module.exports = mongoose.model('Record', RecordSchema);