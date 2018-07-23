"use strict"

const Show = require('../../server/models/show')
const nock = require('nock')

describe('Shows', function(){
	const data = require('./show.json')
	
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
	it('Get show by slug', (done)=>{
		Show.findBySlug(data.ids.slug).then(show=>{
			expect(show.title).to.equal(data.title)
			expect(show.year).to.equal(data.year)
			expect(show.ids.trakt).to.equal(data.ids.trakt)
			expect(show.uri).to.equal(`/api/shows/${data.ids.slug}`)
			done()
		}).catch(done)
	})
	it('Get show by Trakt ID', (done)=>{
		Show.findByTrakt(data.ids.trakt).then(show=>{
			expect(show.title).to.equal(data.title)
			expect(show.year).to.equal(data.year)
			expect(show.ids.trakt).to.equal(data.ids.trakt)
			done()
		}).catch(done)
	})
	it('Sync show', (done)=>{
		Show.findByTrakt(data.ids.trakt).then(show=>{
			expect(show.title).to.equal(data.title)
			return show.sync()
		}).then(show=>{
			expect(show.episodes).to.be.a('array')
			done()
		}).catch(done)
	})
	it('Get Artwork', (done)=>{
		nock(`https://webservice.fanart.tv`).get(`/v3/tv/${data.ids.tvdb}`).reply(200, {
			backgrounds: [],
			banners: [],
			posters: []
		})
		require('nodetv-helpers').trakt().images.get(data.ids.tvdb,'show').then(images=>{
			expect(images.backgrounds).to.be.a('array')
			expect(images.banners).to.be.a('array')
			expect(images.posters).to.be.a('array')
			done()
		}).catch(done)
	})
	/*
	it('Get episode', (done)=>{
		Show.findByTrakt(data.ids.trakt).then(show=>{
			expect(show.title).to.equal(data.title)
			expect(show.episodes).to.be.a('array')
			return show.getEpisode(1,1)
		}).then(episode=>{
			expect(episode.title).to.be.a('string')
			expect(episode.season).to.equal(1)
			expect(episode.episode).to.equal(1)
			done()
		}).catch(done)
	})
	*/
	
	
	it('Single episode title generation', (done)=>{
		Show.findBySlug(data.ids.slug).then(show=>{
			return show.episodes[2].getFilename('file.mp4')
		}).then(filename=>{
			expect(filename).to.equal('Season 01/Episode 03 - Third Episode.mp4')
			done()
		}).catch(done)
	})
	it('Linked episode title generation', (done)=>{
		Show.findBySlug(data.ids.slug).then(show=>{
			return show.episodes[0].getFilename('file.mp4')
		}).then(filename=>{
			expect(filename).to.equal('Season 01/Episode 01-02 - Pilot; Second Episode.mp4')
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
