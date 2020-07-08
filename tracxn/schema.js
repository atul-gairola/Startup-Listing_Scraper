const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const linksSchema = new Schema({
    link: String,
    src: String
});

const companySchema = new Schema({
    slug: String,
    name: String,
    website: String,
    image_url: String,
    last_updated: String,
    pitch: String,
    social_links: [String],
    about: String,
    overview: [{
        detail: String,
        value: String
    }],
    funding_rounds: [{
        date: String,
        funding_amount: String,
        funding_round: String,
        investor_details: String
    }],
    investors: [
        {
            image_url: String,
            name: String,
            location: String
        }
    ],
    revenue: {
        year: String,
        amt: String
    },
    board_members: [{
        name: String,
        role: String
    }],
    cap_table: [{
        share_holder: String,
        holding: String
    }]
}, {strict: false});

// exporting links schema
exports.LinksModel = mongoose.model('tracxn_links', linksSchema);

// exporting company schema
exports.CompanyModel = mongoose.model('tracxn_companies', companySchema);