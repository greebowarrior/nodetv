"use strict"

const User = require('../../server/models/user')

describe('Users', function(){
	
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
	it('Verify password', done=>{
		User.findByUsername(data.username).then(user=>{
			expect(user.verifyPassword('password')).to.be.true
			expect(user.verifyPassword('wrong password')).to.be.false
			done()
		}).catch(done)
	})
	it('Prevent duplicate user', (done)=>{
		let user = new User(data)
		user.setPassword('password','password')
		user.save().then(()=>{
			done(new Error('Duplicate user created'))
		}).catch(()=>{
			done()
		})
	})
	
	it('List users',(done)=>{
		User.find({}).limit(1).then(users=>{
			expect(users).to.be.a('array')
			expect(users).to.have.lengthOf(1)
			done()
		}).catch(done)
	})
	it('Get user by username', (done)=>{
		User.findByUsername(data.username).then(user=>{
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
	
	it('Generate API tokens', done=>{
		User.findByUsername(data.username).then(user=>{
			expect(user.apiToken()).to.be.a('string')
			delete user.tokens
			expect(user.apiToken()).to.be.a('string')
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
