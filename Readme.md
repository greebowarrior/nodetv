# Node TV Rebuild Project

## To do:

- UI
	- Client-side registration
	- Grid view with pagination for movies & shows
	- Details page for movies & shows
		- Config page for shows (hd, feed, enabled, transcode)

- RSS Parser
	- ~~Parse feed and update documents~~
	- Parse feeds on schedule (Hourly? Nightly?)
	- Download automatically (As available)
- Workers
	- Create forked worker system
	- File operations
	- Transcoding
	- Tasks?

- Tasks
	- Run scheduled tasks
		- Update episodes
		- Feed parsing
		- Download torrents automatically
			- Limit to episodes AIRED in the last 7-ish days
		- Completed torrent watcher
			- Remove torrents from Transmission when seeding is complete

- File System scanner
	- Rename file using format string
	- Update when episodes are removed too
- Sockets
	- Authentication
	- Use for notifications
- Helpers
- Tests
- Documentation

---

## Done:

### Express
- Enabled template engine
	- EJS with layouts extension

### Authentication
- Client-side login form
- Passport
	- Local for client-side login
		- Passwords hashed with bcrypt
		- SessionStore in DB
	- UUID (v4) Token based for API

### Database
- Mongoose
	- Using models
- mLab database set up for dev/testing
- User collection
- Show collection
	- Seasons/Episodes saved as subdocuments
	- Add/Subscribe/Unsubscribe methods
- Movie Collection
	- Add/Subscribe/Unsubscribe methods



## Trakt
- Using trakt.tv npm module
- Methods built into routes

## API

- Will handle all actions
- Require authentication (unless an auth call)
	- Use Passport/OAuth?
- Structure API calls intelligently
	- Broken down into manageable scripts

## Sockets

- Notifications
- Live update of current data
	- No need to reload page when fetching listings
