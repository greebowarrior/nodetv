# Phase 1

- ~~Authentication~~
- ~~Database design~~
- ~~Models/controllers~~
- ~~Scheduled feed updates~~
- ~~Automatic download of new episodes~~
- ~~Automatic renaming of new episodes~~
- ~~Automatic transcoding of new episodes~~
- ~~Mark as Collected in Trakt **per user**~~

# Phase 2

- ~~Rebuild REST API endpoints~~
- ~~Create basic UI~~
- ~~Server-side rendering of views~~

# Phase 3

- ~~Get it running on the server~~
- ~~UI: Search & add show~~
- UI: Use directives/components
- Feed Parsing - seems to make things laggy
	- Use child_process?
- Match to shows collection
	- Might be better to have some level of manual assignment?
- Scan existing folders

# Phase 3

- Add proxy support
- Full Show Sync *from* trakt
	- Use this to populate collections automatically?
- Scheduled History Sync with Trakt?
	- Unsubscribe if show is removed, but keep files
- Support multiple feeds per show (e.g. ShowRSS & TVShowsApp)
	- Optional, but TVSA *does* have more data
- Remove *completed* torrents if they've be copied into media directory


# Phase 4

- Ants
- Better UI
	- Theme support
	- Create directory structure for themes?
	- Create Express middleware to allow themes WITHOUT reloading

# Phase 5

- Re-implement `Movie` functionality
	- Models
	- API Endpoints
	- Tasks
- Re-implement YTS API (use proxy)


# Eventually

- Socket notifications
- Git-based updater & scripts



