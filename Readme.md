# Node TV

[![GitHub version](https://badge.fury.io/gh/greebowarrior%2Fnodetv.svg)](https://badge.fury.io/gh/greebowarrior%2Fnodetv)
[![Build Status](https://travis-ci.org/greebowarrior/nodetv.svg?branch=master)](https://travis-ci.org/greebowarrior/nodetv)
[![Coverage Status](https://coveralls.io/repos/github/greebowarrior/nodetv/badge.svg?branch=master)](https://coveralls.io/github/greebowarrior/nodetv?branch=1.1.0)

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
- [MongoDB](https://mongodb.org) 3.4.0 +
- [Transmission](https://transmissionbt.com) 2.94 with RPC Enabled

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

# Configure

You'll need to create a `.env` file in your home directory, using `.env.default` as a template. In most cases, the only variables you may need to edit are:

- `SECRET_KEY` **required**
- `DB_*`
- `TRANSMISSION_*`

By default, NodeTV assumes that MongoDB and Transmission are running on the same machine, using the default ports.  
In the case of MongoDB, it also assumes that you're not using authentication.

# Docker

If all that seems like too much trouble, or you just prefer containers, a [Docker](https://docker.com) image is available.
You'll need to copy the `docker-compose.yml` file to your home directory, and create a .env file

## .env file

- `SECRET_KEY=`
- `MEDIA_ROOT=`
- `TRAKT_CLIENT_ID=`
- `TRAKT_CLIENT_SECRET=`

## Running

As simple as:

> docker-compose up

# Running

Systemd script is available, or use your favourite process manager
