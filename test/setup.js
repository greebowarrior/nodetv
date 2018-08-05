"use strict"

global.Promise = require('bluebird').Promise

require('dotenv-extended').load({path:'.env.test'})
require('../server/database')

let chai = require('chai')
chai.use(require('chai-http'))

global.expect = chai.expect
global.should = chai.should()

//global.server = require('../server')