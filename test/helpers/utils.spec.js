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

	it('getEpisodeNumbers: Daily', (done)=>{
		utils.getEpisodeNumbers('BBC News 2018-01-01').then(data=>{
			expect(data.year).to.equal(2018)
			expect(data.month).to.equal(1)
			expect(data.day).to.equal(1)
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
		done()
	})
	it('isProper', (done)=>{
		expect(utils.isProper('PROPER')).to.be.true
		expect(utils.isProper('REPACK')).to.be.false
		done()
	})
})