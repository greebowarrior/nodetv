"use strict"

const CACHE_NAME = 'nutv'

const CACHE_RESOURCE = [
	// CSS
	'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
	'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/sweetalert/1.1.3/sweetalert.min.css',
	'https://fonts.googleapis.com/css?family=Open+Sans:300,400,800',
	
	// JavaScript
	'https://code.jquery.com/jquery-3.2.1.min.js',
	'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular.min.js',
	'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-animate.min.js',
	'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-cookies.min.js',
	'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-sanitize.min.js',
	'https://ajax.googleapis.com/ajax/libs/angularjs/1.6.5/angular-touch.min.js',
	
	'https://cdnjs.cloudflare.com/ajax/libs/sweetalert/1.1.3/sweetalert.min.js',
	'/socket.io/socket.io.js'
]

self.addEventListener('install', (event)=>{
	event.waitUntil(caches.open(CACHE_NAME).then(cache=>{
		return cache.addAll(CACHE_RESOURCE)
	}))
})
/*
self.addEventListener('activate', (event)=>{
	event.waitUntil(caches.keys().then((keys)=>{
		return Promise.all(keys.filter((key)=>{
			return !key.startsWith(version)
		})
		.map((key) => {
			return caches.delete(key)
		}))
	})
	.then(()=>{
		console.log('[NuTV] Service Worker activated')
	}))
})
*/

self.addEventListener('fetch', (event)=>{
	event.respondWith(caches.match(event.request)
		.then(res=>{
			if (event.request.method === 'POST' || event.request.url.match(/socket\.io\/?EIO/)){
				return fetch(event.request).then(direct=>direct)
			} else {
				if (res) return res
				
				let req = event.request.clone()
				return fetch(req)
					.then(res=>{
						if (!res || res.status !== 200 || res.type !== 'basic') return res
						if (req.url.match(/socket\.io/)) return res
						
						let obj = res.clone()
						caches.open(CACHE_NAME).then((cache)=>{
							cache.put(event.request, obj)
						})
						return res
					})
			}
		})
		.catch(error=>{
			if (error) console.error(`${error.message}: ${event.request.url}`)
		})
	)
	/*
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache=>{
				return fetch(event.request).then(res=>{
					return cache.put(event.request, res.clone())
				})
				.then(res=>{
					return res
				})
			})
			.then(res=>{
				return self.clients.matchAll().then(clients=>{
					clients.forEach(client=>{
						let message = {
							type: 'refresh',
							url: res.url,
							eTag: res.headers.get('ETag')
						}
						client.postMessage(JSON.stringify(message))
					})
				})
			})
			.catch(error=>{
				console.error(error.message)
			})
	)
	*/
})



