"use strict"

const chai = require('chai')
const expect = chai.expect

const Show = require('../server/models/show')

describe('Shows', function(){
	
	const data = {title:'Supergirl', year:2015, ids:{slug:'supergirl',trakt:99046}}
	
	it('Add show', (done)=>{
		let show = new Show(data)
		show.save().then(show=>{
			expect(show.isNew).to.be.false
			expect(show.title).to.equal(data.title)
			done()
		}).catch(done)
	})

	it('Prevent duplicate show', (done)=>{
		let show = new Show(data)
		show.save().then(()=>{
			done(new Error(`Duplicate show created`))
		}).catch(()=>{
			done()
		})
	})


	it('List shows', (done)=>{
		Show.find({}).limit(1).then(shows=>{
			expect(shows).to.be.a('array')
			expect(shows).to.have.lengthOf(1)
			done()
		}).catch(done)
	})

	
	it('Sync show', (done)=>{
		Show.findOne({'ids.trakt':data.ids.trakt}).then(show=>{
			expect(show.title).to.equal(data.title)
			return show.sync()
		}).then(show=>{
			expect(show.episodes).to.be.a('array')
			done()
		}).catch(done)
	})
	
	it('Remove show', (done)=>{
		Show.findBySlug(data.ids.slug).then(show=>{
			expect(show.title).to.equal(data.title)
			return show.remove()
		}).then(()=>{
			done()
		}).catch(done)
	})
})