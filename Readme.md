# Node TV

[![Build Status](https://travis-ci.org/greebowarrior/nodetv.svg?branch=master)](https://travis-ci.org/greebowarrior/nodetv)

A complete re-write of my [existing project](https://github.com/greebowarrior/nessa)
but hopefully learning from my previous mistakes

## Tech Specs

- MEAN stack
- Trakt.tv as primary data source

### Third-party dependencies

- [Trakt](https://trakt.tv) - Provides all Show, Episode, and Movie metadata
- [FanArt.tv](https://fanart.tc) - Show & Movie artwork
- [ShowRSS](https://showrss.com) - RSS Feeds for Shows


# Why do this?

My previous project was built was due to a lack of available software that met my requirements.
In part, this software is also a test-bed for me to trial new technologies and ideas.

So, use it, or don't. I don't care. But if you do, there's a few things to be aware of:

## Requirements

- Developed on: macOS 10.12
- Tested on: Ubuntu Linux 16.04 LTS

It should run on any *nix-compatible system that can run NodeJS.
Totally untested on Windows, but I can't think of any reason it wouldn't work.

You'll need a free Trakt.tv account in order to use their API.

# What does it do?

NodeTV lets you manage a local media library of TV Shows with a tidy interface. Add some RSS feeds and it'll download your shows automatically.

You can also start playback on UPnP network devices from the UI.

# Sounds good, what do I need?

Okay, you need some slight technical experience, and some software. We'll assume you have the former, so here's a list of the latter:

### Third-party software

- [nginx](https://nginx.org) 1.13.0 +
- [Node.js](https://nodejs.org) 8.9.0 +
- [MongoDB](https://mongodb.org) 3.2.0 +
- [Transmission](https://transmissionbt.com) 2.92 with RPC Enabled

# Install

Create a user named `media`

> git clone https://github.com/greebowarrior/nodetv.git /opt/nutv  
> cd /opt/nutv  
> su media
> npm i



Install the systemd service

> sudo cp /opt/nutv/scripts/nutv.service /etc/systemd/system/  
> sudo systemctl reload-daemon  
> sudo systemctl enable nutv.service  
> sudo systemctl start nutv.service  

# Running

Systemd script is available, or use your favourite process manager
