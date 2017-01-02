"use strict";

var forkedWorker = function(worker, payload){
	// Use forked processes for expensive operations
	return new Promise((resolve,reject)=>{
		require('child_process')
			.fork(process.env.HELPERS+'/workers/'+worker)
			.on('message', (message)=>{
				console.debug(message);
			})
			.on('error', (error)=>{
				console.error('forked: %s', error)
				reject(error);
			})
			.on('exit', (error)=>{
				if (error) reject();
				resolve();
			})
			.send(payload);
	});
};

exports.file = {
	copy: (source,target)=>{
		return forkedWorker('file/copy', {source:source,target:target});
	},
	delete: (source)=>{
		return forkedWorker('file/delete', {source:source});
	},
	move: (source,target)=>{
		return forkedWorker('file/move', {source:source,target:target});
	},
	transcode: (source,target,metadata=[])=>{
		return forkedWorker('file/move', {source:source,target:target,metadata:metadata});
	}
}