"use strict"

const mongoose = require('mongoose')
let showSchema = require('./schema/show')

module.exports = mongoose.model('Show', showSchema)