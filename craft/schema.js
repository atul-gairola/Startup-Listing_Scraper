const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dataSchema = new Schema({
    name: String,
    description: String,
    img_url: String,
    tags: [String],
    website: String,
    social_links: [String],
    details: [{
        label: String,
        value: String
    }],
    competitors: [String],
    key_people: [{
        name: String,
        role: String
    }]
});

exports.DataModel = new mongoose.model('craft_companies', dataSchema);