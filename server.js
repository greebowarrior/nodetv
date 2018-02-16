"use strict"

process.title = 'NuTV'
process.chdir(__dirname)

require('dotenv-extended').load()

global.Promise = require('bluebird').Promise
Promise.config({warnings:false})

require('./server/server.js')
