const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dataSchema = new Schema({
    name: String,
    count: Number,
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

const linkSchema = new Schema({
    link: String,
});

exports.DataModel = mongoose.model('craft_companies', dataSchema);

exports.LinkModel = mongoose.model('craft_links', linkSchema);