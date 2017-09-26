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
