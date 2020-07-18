const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const linkSchema = new Schema({
    link: String,
})

const companySchema = new Schema({
    r_c: Number,
    slug: String,
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
exports.LinkModel = new mongoose.model('e27_links', linkSchema);