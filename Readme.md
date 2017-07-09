# Node TV

A complete re-write of my [existing project](https://github.com/greebowarrior/nessa)
but hopefully learning from my previous mistakes

## Tech Specs

- MongoDB backend
- Angular.js frontend
- Trakt.tv as primary data source

# Why do this?

My previous project was built was due to a lack of available software that met my requirements.
In part, this software is also a test-bed for me to trial new technologies and ideas.

So, use it, or don't. I don't care. But if you do, there's a few things to be aware of:

## Requirements

- Developed on: macOS 10.12
- Tested on: Ubuntu Linux 16.04 LTS

It should work on any *nix-compatible system that can run NodeJS.
Totally untested on Windows, but I can't think of any reason it wouldn't.

### Third-party software

- [Node.js](https://nodejs.org) 6.10
- [MongoDB](https://mongodb.org) 2.6.x
- [Transmission](https://transmissionbt.com) 2.92 with RPC Enabled

I'd recommend using nginx with SSL as a reverse proxy. Example config to be added at a later date.

### Third-party dependencies

- [Trakt](https://trakt.tv) - Provides all Show, Episode, and Movie metadata
- [FanArt.tv](https://fanart.tc) - Show & Movie artwork
- [ShowRSS](https://showrss.com) - RSS Feeds for Shows
- [Proxy Spider](https://trakt.tv)

# Install

Create a user `media`

> git clone https://github.com/greebowarrior/nodetv.git /opt/nutv  
> cd /opt/nutv  
> npm install  

Install the systemd service

> sudo cp /opt/nutv/scripts/nutv.service /etc/systemd/system/  
> sudo systemctl reload-daemon  
> sudo systemctl enable nutv.service  
> sudo systemctl start nutv.service  

# Running

Systemd script is available, or use your favourite process manager
