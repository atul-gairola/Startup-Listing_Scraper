const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const companySchema = new Schema({
    name: String,
    logo: String,
    location: String,
    employees: String,
    about: String,
    totalFunding: String,
    foundedOn: String,
    alias: String,
    industry: String,
    tags: [String],
    address: String,
    mobile: String,
    email: String,
    website: String,
    blog: String,
    member_details: [{
        img: String,
        name: String,
        role: String,
        date: String
    }],
    investors: [{
        name: String,
        date: String
    }],
    fundings: [{
        date: String,
        stage: String
    }]
});


exports.DataModel = mongoose.model('vbProfile_companies', companySchema);