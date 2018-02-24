"use strict"

const CACHE_NAME = 'nutv'

const CACHE_RESOURCE = [
	// CSS
	'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
	'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
	'https://fonts.googleapis.com/css?family=Open+Sans:300,400,800',
	// ICONS
	'/static/gfx/icons/icon-32.png',
	'/static/gfx/icons/icon-192.png',
	// JavaScript
	'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.9/angular.min.js',
	'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.9//angular-animate.min.js',
	'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.9/angular-cookies.min.js',
	'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.9/angular-sanitize.min.js',
	'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.9/angular-touch.min.js',
	'https://unpkg.com/@uirouter/angularjs@1.0/release/angular-ui-router.min.js',
	'https://unpkg.com/sweetalert2@7/dist/sweetalert2.all.js'
]

self.addEventListener('install', (event)=>{
	event.waitUntil(caches.open(CACHE_NAME)
		.then(cache=>{
			return cache.addAll(CACHE_RESOURCE)
		})
		.then(()=>{
			 return self.skipWaiting()
		})
		.catch(error=>{
			console.error(error.message)
		})
	)
})


self.addEventListener('activate', (event)=>{
	event.waitUntil(self.clients.claim())
	
	/*
	event.waitUntil(caches.keys().then((keys)=>{
		return Promise.all(keys.filter((key)=>{
			return !key.startsWith(version)
		})
		.map((key) => {
			return caches.delete(key)
		}))
	})
	.then(()=>{
		
	}))
	*/
})


self.addEventListener('fetch', (event)=>{
	event.respondWith(caches.open(CACHE_NAME).then(cache=>{
		
		return new Promise(resolve=>{
			fetch(event.request)
				.then(response=>{
					resolve(response)
					
					if (response.status === 200 && event.request.method === 'GET' && !event.request.url.match(/socket\.io\/\?EIO/)){
						cache.put(event.request.clone(), response.clone())
					}
					
				})
				.catch(()=>{
					if (event.request.url.match(/socket\.io\/\?EIO/)){
						return resolve(new Response('', {
							status: 408,
							statusText: 'Request timed out.'
						}))
					}
					cache.match(event.request).then(response=>{
						if (response) return resolve(response)
						
						resolve(new Response('', {
							status: 408,
							statusText: 'Request timed out.'
						}))
					})
				})
			})
	}))
})
