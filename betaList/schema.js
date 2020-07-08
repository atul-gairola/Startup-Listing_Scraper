require('dotenv').config()
const mongoose = require('mongoose');


let Schema = mongoose.Schema;

// Market Schema
let marketSchema = new Schema({
    industryName: String,
    count: Number
});

// Startup Schema
let startupSchema = new Schema({
        name: String,
        industryName: String,
        images:[String],
        pitch: String,
        description: String,
        siteLink: String,
        socials:{
          twitter: String,
          facebook: String
        },
        makersDetails: [{
            avatar: String,
            name: String,
            role: String
        }]
});

// Exporting Market Schema model 
exports.MarketModel = mongoose.model('Betalist_industry', marketSchema);

// Exporting Startup Schema model
exports.StartupModel = mongoose.model('Betalist_startup', startupSchema);


