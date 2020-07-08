const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const companySchema = new Schema({
    name: String,
    pitch: String,
    logo_img: String,
    about: String,
    date_founded: String,
    website: String,
    social_links: [String],
    location: String,
    industry_tags: [String],
    funding: [{
        round: String,
        amount: String,
        date: String
    }]
})

exports.CompanyModel = new mongoose.model('e27_companies', companySchema);