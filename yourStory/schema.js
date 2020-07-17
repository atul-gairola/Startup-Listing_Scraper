const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const linkSchema = new Schema({
  link: String,
  r_c: Number  
});

const dataSchema = new Schema({
r_c: Number,  
name: String,
img: String,
pitch: String,
description: String,
basicDetails: [Schema.Types.Mixed],
funding: String,
investors: [{
  name: String,
  linkedin: String
}],
socials: [String],
tags: [String],
slug: String
}, {
  strict: false
});

exports.LinkModel = mongoose.model('yourStory_Links', linkSchema);

exports.DataModel = mongoose.model('yourStory_Data', dataSchema);