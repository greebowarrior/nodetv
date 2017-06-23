"use strict"

const mongoose = require('mongoose')

const socketSchema = mongoose.Schema({
	id: String,
	heartbeat: {type: Date, default: new Date(), expires: 600},
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	created: {type: Date, default: new Date()}
})

socketSchema.statics.findByUser = function(user){
	return this.find({
		user: mongoose.Types.ObjectId(user._id)
	})
}
socketSchema.statics.findBySocket = function(socket){
	return this.findOne({id:socket})
}

module.exports = mongoose.model('Socket', socketSchema)