"use strict"

const chai = require('chai')
const expect = chai.expect

describe('Shows', function(){
	let Show = require('../server/models/show')
	
	const data = {title:'Supergirl', year:2015, ids:{slug:'supergirl',trakt:99046}}
	
	it('Add show', (done)=>{
		let show = new Show(data)
		show.save().then(show=>{
			expect(show.isNew).to.be.false
			expect(show.title).to.equal(data.title)
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