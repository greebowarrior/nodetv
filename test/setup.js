"use strict"

require('dotenv-extended').load()
require('../server/database')

let chai = require('chai')
chai.use(require('chai-http'))

global.expect = chai.expect
global.should = chai.should()

//global.server = require('../server')