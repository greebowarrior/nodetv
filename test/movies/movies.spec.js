"use strict"

const Movie = require('../../server/models/movie')
const nock = require('nock')

describe('Movies', function(){
	const data = require('./movie.json')
	
	it('Add movie', (done)=>{
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
	it('List movies', (done)=>{
		Movie.find({}).limit(1).then(movies=>{
			expect(movies).to.be.a('array')
			expect(movies).to.have.lengthOf(1)
			done()
		}).catch(done)
	})

	it('Update all from latest feed', done=>{
		nock('http://localhost').get(`/list_movies.json`).reply(200, require('./list_movies.json'))
		
		Movie.updateLatest().then(movies=>{
			expect(movies).to.have.lengthOf(1)
			expect(movies[0].title).to.equal(data.title)
			done()
		}).catch(done)
	})
	it('Parse feed', done=>{
		nock('http://localhost').get(`/list_movies.json?query_term=${data.ids.imdb}`).reply(200, require('./list_movies.json'))
		
		Movie.findByTrakt(data.ids.trakt).then(movie=>{
			delete movie.hashes
			return movie.parseFeed()
		}).then(movie=>{
			expect(movie.hashes).to.have.lengthOf(3)
			done()
		}).catch(done)
	})
	it('Set downloading', (done)=>{
		Movie.findByTrakt(data.ids.trakt).then(movie=>{
			expect(movie.hashes).to.have.lengthOf(3)
			return movie.setDownloading({btih:movie.hashes[0].btih, quality:movie.hashes[0].quality})
		}).then(movie=>{
			expect(movie.file.quality).to.equal('3D')
			expect(movie.file.download.active).to.be.true
			expect(movie.file.download.hashString).to.equal('237457BA8029DEF449A0D3EF5B7E508780AC68DB')
			movie.save()
			
			done()
		}).catch(done)
	})
	
	it('Get movie by slug', (done)=>{
		Movie.findBySlug(data.ids.slug).then(movie=>{
			expect(movie.title).to.equal(data.title)
			expect(movie.year).to.equal(data.year)
			expect(movie.ids.slug).to.equal(data.ids.slug)
			expect(movie.ids.trakt).to.equal(data.ids.trakt)
			done()
		}).catch(done)
	})
	it('Get movie by Trakt ID', (done)=>{
		Movie.findByTrakt(data.ids.trakt).then(movie=>{
			expect(movie.title).to.equal(data.title)
			expect(movie.year).to.equal(data.year)
			expect(movie.ids.slug).to.equal(data.ids.slug)
			expect(movie.ids.trakt).to.equal(data.ids.trakt)
			expect(movie.uri).to.equal(`/api/movies/${data.ids.slug}`)
			done()
		}).catch(done)
	})
	it('Get movie by hashString', done=>{
		Movie.findByHashString('237457BA8029DEF449A0D3EF5B7E508780AC68DB').then(movie=>{
			expect(movie.ids.trakt).to.equal(data.ids.trakt)
			done()
		}).catch(done)
	})
	
	it('Sync movie', (done)=>{
		nock('https://api.trakt.tv').get(`/movies/${data.ids.trakt}?extended=full`).reply(200, data)
		
		Movie.findByTrakt(data.ids.trakt).then(movie=>{
			expect(movie.title).to.equal(data.title)
			expect(movie.year).to.equal(data.year)
			return movie.sync()
		}).then(movie=>{
			expect(movie.overview).to.be.a('string')
			expect(movie.ids.imdb).to.equal(data.ids.imdb)
			done()
		}).catch(done)
	})
	it('Get Alpha for directory', (done)=>{
		Movie.findByTrakt(data.ids.trakt).then(movie=>{
			expect(movie.getAlpha()).to.equal('T')
			done()
		}).catch(done)
	})
	it('Get directory', (done)=>{
		Movie.findByTrakt(data.ids.trakt).then(movie=>{
			let path = require('path').join(process.env.MEDIA_ROOT,
				process.env.MEDIA_MOVIES,
				'A-Z', 'T', 'Titanic (1997)'
			)
			expect(movie.getDirectory()).to.equal(path)
			done()
		}).catch(done)
	})
	
	it('Get infohash', done=>{
		Movie.findByTrakt(data.ids.trakt).then(movie=>{
			movie.config.quality = '1080p'
			return movie.getInfoHash()
		}).then(res=>{
			expect(res.btih).to.equal('98CD5D90252265F1C59AB47330FF4C39F48CCC78')
			expect(res.quality).to.equal('1080p')
			done()
		}).catch(done)
	})
	
	it('Set quality', (done)=>{
		Movie.findByTrakt(data.ids.trakt).then(movie=>{
			expect(movie.setQuality('1080p').file.quality).to.equal('1080p')
			expect(movie.setQuality('480p').file.quality).to.equal('SD')
			done()
		}).catch(done)
	})
	it('Get artwork', (done)=>{
		nock(`https://webservice.fanart.tv`).get(`/v3/movies/${data.ids.tmdb}`).reply(200, data.images)
		
		require('nodetv-helpers').trakt().images.get(data.ids.tmdb,'movie').then(images=>{
			expect(images.backgrounds).to.be.a('array')
			expect(images.backgrounds).to.have.lengthOf(0)
			expect(images.banners).to.be.a('array')
			expect(images.posters).to.be.a('array')
			done()
		}).catch(done)
	})
	it('Get filename', (done)=>{
		Movie.findByTrakt(data.ids.trakt).then(movie=>{
			movie.setQuality('1080p')
			expect(movie.getFilename('file.mp4')).to.equal('Titanic (1997) [1080p].mp4')
			expect(movie.getFilename('')).to.equal('Titanic (1997) [1080p].mp4')
			done()
		}).catch(done)
	})
	it('Remove movie', (done)=>{
		Movie.findBySlug(data.ids.slug).then(movie=>{
			expect(movie.title).to.equal(data.title)
			return movie.remove()
		}).then(()=>{
			done()
		}).catch(done)
	})
})
