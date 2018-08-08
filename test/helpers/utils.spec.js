"use strict"

describe('Utils', function(){
	
	const utils = require('nodetv-helpers').utils
	
	it('getEpisodeNumbers: Episodic', (done)=>{
		utils.getEpisodeNumbers('Game.Of.Thrones.S01E01').then(data=>{
			expect(data.season).to.equal(1)
			expect(data.episodes).to.be.a('array')
			expect(data.episodes[0]).to.equal(1)
			done()
		}).catch(done)
	})
	it('getEpisodeNumbers: Daily shows', (done)=>{
		utils.getEpisodeNumbers('BBC News 2018-01-01').then(data=>{
			expect(data.year).to.equal(2018)
			expect(data.month).to.equal(1)
			expect(data.day).to.equal(1)
			done()
		}).catch(done)
	})
	it('getEpisodeNumbers: Mr Robot', (done)=>{
		utils.getEpisodeNumbers('eps1.0_hellofriend.mov').then(data=>{
			expect(data.season).to.equal(1)
			expect(data.episodes).to.be.an('array')
			expect(data.episodes[0]).to.equal(1)
			done()
		}).catch(done)
	})
	it('getEpisodeNumbers: Failure', (done)=>{
		utils.getEpisodeNumbers('herpderp').catch(data=>{
			expect(data).to.be.null;
			done()
		})
	})
	
	it('getProxy', (done)=>{
		require('nock')(`https://api.getproxylist.com`).filteringPath(()=>'/proxy').get(`/proxy`).reply(200, {
			protocol: 'https', ip: '1.1.1.1', port: 8080
		})
		
		utils.getProxy().then(data=>{
			expect(data).to.equal('https://1.1.1.1:8080')
			done()
		}).catch(error=>{
			expect(error).to.be.false
			done()
		})
	})
	it('getProxy failure', (done)=>{
		require('nock')(`https://api.getproxylist.com`).filteringPath(()=>'/proxy').get(`/proxy`).reply(200, {})
		
		utils.getProxy().then(data=>{
			expect(data).to.be.false
			done()
		}).catch(done)
	})
	it('getQuality', (done)=>{
		expect(utils.getQuality('1080P')).to.equal('1080p')
		expect(utils.getQuality('720P')).to.equal('720p')
		expect(utils.getQuality('480P')).to.equal('480p')
		expect(utils.getQuality('potato')).to.equal('SD')
		done()
	})
	it('isHD', (done)=>{
		expect(utils.isHD('1080P')).to.be.true
		expect(utils.isHD('720P')).to.be.true
		expect(utils.isHD('480P')).to.be.false
		expect(utils.isHD('potato')).to.be.false
		done()
	})
	it('isRepack', (done)=>{
		expect(utils.isRepack('FINAL')).to.be.true
		expect(utils.isRepack('PROPER')).to.be.true
		expect(utils.isRepack('REPACK')).to.be.true
		expect(utils.isRepack('RERIP')).to.be.true
		expect(utils.isRepack('x264 YTS.AG')).to.be.false
		done()
	})
	it('isProper', (done)=>{
		expect(utils.isProper('PROPER')).to.be.true
		expect(utils.isProper('REPACK')).to.be.false
		done()
	})
	it('getTraktResolution', (done)=>{
		expect(utils.getTraktResolution('4K')).to.equal('uhd_4k')
		expect(utils.getTraktResolution('1080p')).to.equal('hd_1080p')
		expect(utils.getTraktResolution('720p')).to.equal('hd_720p')
		expect(utils.getTraktResolution('SD')).to.equal('sd_480p')
		done()
	})
	it('getInfoHash', (done)=>{
		const btih = 'magnet:?xt=urn:btih:060AFC9881724A564103BC31DA19F7E9B22AFE29'
		expect(utils.getInfoHash({link:btih})).to.equal('060AFC9881724A564103BC31DA19F7E9B22AFE29')
		expect(utils.getInfoHash({guid:btih})).to.equal('060AFC9881724A564103BC31DA19F7E9B22AFE29')
		expect(utils.getInfoHash({})).to.be.false
		done()
	})
	it('walkDir', (done)=>{
		const path = require('path').join(process.cwd(),'test','helpers')
		utils.walkDir(path).then(files=>{
			expect(files).to.be.a('array')
		//	expect(files).to.have.lengthOf(3)
		//	expect(files[0]).to.equal('utils.spec.js')
			done()
		}).catch(done)
	})
	it('normalize', (done)=>{
		let string = utils.normalize('string')
		expect(string).to.equal('string')
		done()
	})
	
	it('Model loader', done=>{
		expect(()=>require('nodetv-helpers').model('show')).to.not.throw()
		expect(()=>require('nodetv-helpers').model('derp')).to.throw()
		expect(()=>require('nodetv-helpers').model()).to.throw()
		done()
	})
})
