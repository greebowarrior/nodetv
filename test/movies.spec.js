"use strict"

const chai = require('chai')
const expect = chai.expect

const Movie = require('../server/models/movie')

describe('Movies', function(){
	
	const data = {title:'Titanic', year:1997, ids:{slug:'titanic-1997',trakt:475}}
	
	it('Add Movie', (done)=>{
		let movie = new Movie(data)
		movie.save().then(movie=>{
			expect(movie.isNew).to.be.false
			expect(movie.title).to.equal(data.title)
			done()
		}).catch(done)
	})

	it('Prevent duplicate movie', (done)=>{
		let movie = new Movie(data)
		movie.save().then(()=>{
			done(new Error(`Duplicate movie created`))
		}).catch(()=>{
			done()
		})
	})
	
	it('List Movies', (done)=>{
		Movie.find({}).limit(1).then(movies=>{
			expect(movies).to.be.a('array')
			expect(movies).to.have.lengthOf(1)
			done()
		}).catch(done)
	})
	
	it('Sync Movie', (done)=>{
		Movie.findOne({'ids.trakt':data.ids.trakt}).then(movie=>{
			expect(movie.title).to.equal(data.title)
			return movie.sync()
		}).then(movie=>{
			expect(movie.overview).to.be.a('string')
			expect(movie.ids.imdb).to.equal('tt0120338')
			done()
		}).catch(done)
	})
	
	it('Remove Movie', (done)=>{
		Movie.findBySlug(data.ids.slug).then(movie=>{
			expect(movie.title).to.equal(data.title)
			return movie.remove()
		}).then(()=>{
			done()
		}).catch(done)
	})
})