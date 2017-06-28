"use strict"

const request = require('request-promise')

// Update DDNS service hourly

require('node-schedule').scheduleJob('0 * * * *', ()=>{
	try {
		if (!process.env.DDNS_USER || !process.env.DDNS_TOKEN) return
		
		console.info('Updating DynDNS')
		
		const updateDNS = data=>{
			const options = {
				headers: {
					'x-token': process.env.DDNS_TOKEN,
					'x-username': process.env.DDNS_USER
				},
				json: true,
				body: data
			}
			return request.post('https://dns.silico.media', options)
				.then(body=>{
					return body
				})
				.catch(error=>{
					console.error(error)
				})
		}
		
		let promises = [
			request('http://v4.ipv6-test.com/api/myip.php').then(body=>{
				return {type:'v4',address:body}
			}),
			request('http://v6.ipv6-test.com/api/myip.php').then(body=>{
				return {type:'v6',address:body}
			})
		]
		
		Promise.all(promises)
			.then(ips=>{
				return updateDNS(ips)
			})
			.then(()=>{
				console.log('DDNS Updated')
			})
			.catch(()=>{
				console.error('DynDNS update failed')
			})
	} catch(e){
		console.error(e.message)
	}
})