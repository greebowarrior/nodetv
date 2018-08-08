"use strict"

const nock = require('nock')

describe('Torrent helpers', function(){
	
	const torrents = require('nodetv-helpers').torrents
	const data = require('./torrents.json')
	
	beforeEach(function(){
		nock(`http://${process.env.TRANSMISSION_HOST}:${process.env.TRANSMISSION_PORT}`)
			.post(process.env.TRANSMISSION_URL).reply(200, data)
	})
	
	it ('List torrents', done=>{
		torrents.list().then(list=>{
			expect(list).to.be.an('array')
			expect(list).to.have.lengthOf(2)
			done()
		}).catch(done)
	})
	it ('Get complete torrents', done=>{
		torrents.getComplete().then(list=>{
			expect(list).to.be.an('array')
			expect(list).to.have.lengthOf(1)
			done()
		}).catch(done)
	})
	it ('Get torrent by hashstring', done=>{
		torrents.findByHash('ABC123').then(item=>{
			expect(item).to.be.an('object')
			expect(item.id).to.equal(1)
			expect(item.hashString).to.equal('ABC123')
			done()
		}).catch(done)
	})
	it ('Create magnet', done=>{
		torrents.createMagnet('ABC123').then(result=>{
			expect(result).to.be.a('string')
			expect(result).to.match(/^magnet\:\?xt\=urn\:btih\:ABC123/)
			done()
		}).catch(done)
	})
	
})