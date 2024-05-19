const { application } = require("express")
const pkg = require("../package.json")
module.exports = {
    applicationName:pkg.name,
    mongodb:{
        url:process.env.MONGO_URI
    }
}