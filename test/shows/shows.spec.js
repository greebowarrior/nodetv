"use strict"

const Show = require('../../server/models/show')
const User = require('../../server/models/user')

const nock = require('nock')

describe('Shows', function(){
	const data = require('./show.json')
	
	it('Add show', done=>{
		let show = new Show(data)
		show.save().then(show=>{
			expect(show.isNew).to.be.false
			expect(show.title).to.equal(data.title)
			done()
		}).catch(done)
	})
	it('Prevent duplicate show', done=>{
		let show = new Show(data)
		show.save().then(()=>{
			done(new Error(`Duplicate show created`))
		}).catch(()=>{
			done()
		})
	})
	
	it('List shows', done=>{
		Show.find({}).limit(1).then(shows=>{
			expect(shows).to.be.a('array')
			expect(shows).to.have.lengthOf(1)
			done()
		}).catch(done)
	})
	it('List enabled shows', done=>{
		Show.findEnabled().then(shows=>{
			expect(shows).to.have.lengthOf(1)
			done()
		}).catch(done)
	})
	
	it('Show subscription', done=>{
		let user = new User(require('../users/user.json'))
		user.setPassword('password','password')
		
		user.save().then(user=>{
			return Show.findByTrakt(data.ids.trakt).then(show=>{
				return show.subscribe(user).save()
			}).then(show=>{
				expect(show.subscribers).to.have.lengthOf(1)
				expect(show.subscribers[0].subscriber).to.equal(user._id)
				return show.unsubscribe(user).save()
			}).then(show=>{
				expect(show.subscribers).to.have.lengthOf(0)
				return user.remove()
			})
		}).then(()=>{
			done()
		}).catch(done)
	})
	
	it('Parse RSS feed', done=>{
		Show.findByTrakt(data.ids.trakt).then(show=>{
			expect(show.config.feed).to.be.an('array')
			expect(show.config.feed).to.have.lengthOf(1)
			expect(show.config.feed[0].url).to.equal('http://localhost/show.rss')
			
			nock('http://localhost').get('/show.rss').reply(200, (uri,body,cb)=>{
				require('fs').readFile('test/shows/show.rss' , cb)
			})
			return show.parseFeed()
			
		}).then(show=>{
			expect(show.episodes[2].hashes).to.have.lengthOf(1)
			
			
		//	console.debug(show.episodes[2])
			
			done()
		}).catch(done)
	})
	
	it('Get show by hashstring', done=>{
		Show.findByHashString('ABC123').then(show=>{
			expect(show.title).to.equal(data.title)
			done()
		}).catch(done)
	})
	it('Get show by slug', done=>{
		Show.findBySlug(data.ids.slug).then(show=>{
			expect(show.title).to.equal(data.title)
			expect(show.year).to.equal(data.year)
			expect(show.ids.trakt).to.equal(data.ids.trakt)
			expect(show.uri).to.equal(`/api/shows/${data.ids.slug}`)
			done()
		}).catch(done)
	})
	it('Get show by Trakt ID', done=>{
		Show.findByTrakt(data.ids.trakt).then(show=>{
			expect(show.title).to.equal(data.title)
			expect(show.year).to.equal(data.year)
			expect(show.ids.trakt).to.equal(data.ids.trakt)
			done()
		}).catch(done)
	})
	it('Get show URI', done=>{
		Show.findByTrakt(data.ids.trakt).then(show=>{
			expect(show.uri).to.equal(`/api/shows/${data.ids.slug}`)
			done()
		}).catch(done)
	})
	it('Sync show', done=>{
		nock('https://api.trakt.tv').get(`/shows/${data.ids.trakt}?extended=full`).reply(200, data)
		nock('https://api.trakt.tv').get(`/shows/${data.ids.trakt}/seasons?extended=episodes,full`).reply(200, data.seasons)
		
		Show.findByTrakt(data.ids.trakt).then(show=>{
			expect(show.title).to.equal(data.title)
			return show.sync()
		}).then(show=>{
			expect(show.episodes).to.be.a('array')
			done()
		}).catch(done)
	})
	
	it('Get artwork', done=>{
		nock(`https://webservice.fanart.tv`).get(`/v3/tv/${data.ids.tvdb}`).reply(200, data.images)
		
		require('nodetv-helpers').trakt().images.get(data.ids.tvdb,'show').then(images=>{
			expect(images.backgrounds).to.be.an('array')
			expect(images.banners).to.be.an('array')
			expect(images.posters).to.be.an('array')
			done()
		}).catch(done)
	})
	it('Get S01E01', done=>{
		Show.findByTrakt(data.ids.trakt).then(show=>{
			expect(show.title).to.equal(data.title)
			expect(show.episodes).to.be.a('array')
			return show.getEpisode(1,1)
		}).then(episode=>{
			expect(episode.title).to.be.a('string')
			expect(episode.season).to.equal(1)
			expect(episode.episode).to.equal(1)
			expect(episode.uri).to.equal(`/api/shows/${data.ids.slug}/seasons/1/episodes/1`)
			done()
		}).catch(done)
	})
	it('Get season', done=>{
		Show.findByTrakt(data.ids.trakt).then(show=>{
			return show.seasons[0].getEpisodes()
		}).then(episodes=>{
			expect(episodes).to.have.lengthOf(3)
			done()
		}).catch(done)
	})
	
	it('Set S01E01 as downloading', done=>{
		Show.findByTrakt(data.ids.trakt).then(show=>{
			return show.getEpisode(1,1).then(episode=>{
				return episode.setDownloading('ABC123').then(()=>{
					expect(episode.file.download.active).to.be.true;
					expect(episode.file.download.hashString).to.equal('ABC123')
					done()
				})
			})
		}).catch(done)
	})
	
	it('Linked episode title generation', done=>{
		Show.findBySlug(data.ids.slug).then(show=>{
			return show.episodes[0].getFilename('file.mp4')
		}).then(filename=>{
			expect(filename).to.equal('Season 01/Episode 01-02 - Pilot; Stronger Together.mp4')
			done()
		}).catch(done)
	})	
	it('Single episode title generation', done=>{
		Show.findBySlug(data.ids.slug).then(show=>{
			return show.episodes[2].getFilename('file.mp4')
		}).then(filename=>{
			expect(filename).to.equal('Season 01/Episode 03 - Fight or Flight.mp4')
			done()
		}).catch(done)
	})
	
	it('Scan directory', done=>{
		Show.findBySlug(data.ids.slug).then(show=>{
			const dir = show.getDirectory()
			expect(dir).to.equal(`${process.env.MEDIA_ROOT}${process.env.MEDIA_SHOWS}Supergirl`)
			
			let res = []
			let files = ['S01E01E02.mp4','S01E03.mp4']
			
			files.forEach(file=>{
				res.push(require('fs-extra').writeFile(require('path').join(dir,file),''))
			})
			return Promise.all(res).then(()=>{
				return show.scan()
			})
		}).then(show=>{
			return show.getEpisode(1,1).then(episode=>{
				expect(episode.file.filename).to.equal('Season 01/Episode 01-02 - Pilot; Stronger Together.mp4')
				done()
			})
		}).catch(done)
	})
	it('Remove show', done=>{
		Show.findBySlug(data.ids.slug).then(show=>{
			expect(show.title).to.equal(data.title)
			return require('fs-extra').remove(show.getDirectory()).then(()=>{
				return show.remove()
			})
		}).then(()=>{
			done()
		}).catch(done)
	})
})
