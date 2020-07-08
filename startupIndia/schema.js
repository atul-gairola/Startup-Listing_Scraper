const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dataSchema = new Schema({
name: String,
img: String,
website: String,
description: String,
details: [{
    title: String,
    content: String
}],
dpiit_recognised: String,
members: [{
    name: String,
    pic: String,
    profile: String,
    role: String,
    socialInfos: [{
        social: String,
        url: String
    }]
}]
});

exports.DataModel = new mongoose.model('startup_india_companies', dataSchema);