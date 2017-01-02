"use strict";

// convert MKVs to MP4s using avconv/ffmpeg

var fs = require('fs'),
	mime = require('mime-types'),
	path = require('path');

process.on('message', function(msg){
	try {
		if (!msg.source || !msg.target){
			process.send({message:'Transcode: Missing parameter(s)'});
			process.exit(1);
		}
		
		if (!fs.existsSync(path.dirname(msg.target))){
			require('mkdirp').sync(path.dirname(msg.target), 775);
		}
		
		var args = [
			'-i', msg.source,
			'-c:v', 'copy',
			'-c:a', 'copy',
			'-y'
		];
		
		if (mime.lookup(msg.source) === 'video/x-matroska' && mime.lookup(msg.target) === 'video/mp4'){
			args.push('-sn'); // MP4s don't like embedded subtitles
		}
		
		if (msg.metadata){
			/*
			var example = [
				{name:'title',value:'Episode 01 - Winter is Coming'},
				{name:'year',value:'2011'}
			];
			*/
			msg.metadata.forEach(meta=>{
				if (meta.name == 'poster'){
					args.push('-attach', meta.value);
					args.push('-metadata:s:t', 'mimetype='+mime.lookup(meta.value));
				} else {
					args.push('-metadata', meta.name+'="'+meta.value+'"');
				}
			});
		}
		args.push(msg.target);
		
		var remux = require('child_process').spawn('avconv', args);
		remux.on('close', function(code){
			if (!code) fs.chmodSync(msg.target, 0o664);
			process.exit(code);
		});
		remux.stdout.on('data', function(data){
			process.send(data.toString());
		});
		remux.stderr.on('data', function(data){
			process.send(data.toString());
		});
	} catch(e){
		process.send(e);
		process.exit(1);
	}
});


//ffmpeg -i ultron.mp4 -c:v copy -c:a copy -sn -y -attach image.jpg -metadata:s:t mimetype=image/jpeg output.mp4