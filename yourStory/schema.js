const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const linkSchema = new Schema({
  link: String,
  r_c: Number  
});

exports.LinkModel = mongoose.model('yourStory_Links', linkSchema);