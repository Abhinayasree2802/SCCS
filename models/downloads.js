const mongoose = require("mongoose")

const downloadSchema = new mongoose.Schema({
    Numberofdownloads:{
        type:String,
    },
    downloads : {
        type : Number,
        default:0
    },
})

const Download = new mongoose.model("Download" , downloadSchema)
module.exports = Download