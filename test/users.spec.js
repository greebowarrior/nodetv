"use strict"

require('dotenv-extended').load()
require('../server/database')

const chai = require('chai')
const expect = chai.expect

describe('Users', function(){
	let User = require('../server/models/user')
		
	it('Create user', (done)=>{
		let user = new User({username:'mocha'})
		user.setPassword('password','password')
		user.save().then(user=>{
			expect(user.isNew).to.be.false
			expect(user.tokens).to.have.lengthOf(1)
			done()
		}).catch(done)
	})

	it('List users',(done)=>{
		User.find({}).then(users=>{
			expect(users).to.be.a('array')
			done()
		}).catch(done)
	})
	
	it('Get user', (done)=>{
		User.findByUsername('mocha').then(user=>{
			expect(user.username).to.equal('mocha')
			expect(user.verifyPassword('password')).to.be.true
			expect(user.tokens).to.have.lengthOf(1)
			done()
		}).catch(done)
	})
	
	it('Delete user', (done)=>{
		User.findByUsername('mocha').then(user=>{
			return user.remove()
		}).then(()=>{
			done()
		}).catch(done)
	})
})