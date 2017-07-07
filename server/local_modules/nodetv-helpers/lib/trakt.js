"use strict"

const TraktHelper = function(user){
	let trakt = new (require('trakt.tv'))({
		client_id: process.env.TRAKT_CLIENT_ID,
		client_secret: process.env.TRAKT_CLIENT_SECRET,
		redirect_uri: process.env.TRAKT_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob',
		plugins: {
			images: require('trakt.tv-artwork'),
			matcher: require('trakt.tv-matcher'),
			ondeck: require('trakt.tv-ondeck')
		},
		options: {
			images: {apikey:'b983ff2542fb16b97009aef70d8ed6e4'}	// fanart.tv API key
		}
	})
	if (user){
		trakt.import_token(user.trakt)
			.then(result=>{
				if (result.access_token !== user.trakt.access_token){
					user.trakt = {
						access_token: result.access_token,
						expires: new Date(result.expires),
						refresh_token: result.refresh_token
					}
					user.save()
				}
			})
	}
	return trakt
}

module.exports = TraktHelper