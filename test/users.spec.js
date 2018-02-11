"use strict"

const chai = require('chai')
const expect = chai.expect

describe('Users', function(){
	let User = require('../server/models/user')
	
	const data = {username:'mocha',email:'mocha@example.com'}
	
	it('Create user', (done)=>{
		let user = new User(data)
		user.setPassword('password','password')
		user.save().then(user=>{
			expect(user.isNew).to.be.false
			expect(user.tokens).to.have.lengthOf(1)
			data.tokens = user.tokens
			done()
		}).catch(done)
	})

	it('List users',(done)=>{
		User.find({}).then(users=>{
			expect(users).to.be.a('array')
			done()
		}).catch(done)
	})
	
	it('Get user by username', (done)=>{
		User.findByUsername('mocha').then(user=>{
			expect(user.username).to.equal(data.username)
			expect(user.email).to.equal(data.email)
			expect(user.verifyPassword('password')).to.be.true
			expect(user.tokens).to.have.lengthOf(1)
			done()
		}).catch(done)
	})
	
	it('Get user by email', (done)=>{
		User.findByUsername(data.email).then(user=>{
			expect(user.username).to.equal(data.username)
			expect(user.email).to.equal(data.email)
			expect(user.verifyPassword('password')).to.be.true
			expect(user.tokens).to.have.lengthOf(1)
			done()
		}).catch(done)
	})

	it('Get user by token', (done)=>{
		User.findByToken(data.email, data.tokens[0].token).then(user=>{
			expect(user.username).to.equal(data.username)
			expect(user.email).to.equal(data.email)
			expect(user.verifyPassword('password')).to.be.true
			expect(user.tokens).to.have.lengthOf(1)
			done()
		}).catch(done)
	})
	
	it('Delete user', (done)=>{
		User.findByUsername(data.username).then(user=>{
			return user.remove()
		}).then(()=>{
			done()
		}).catch(done)
	})
})