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
	}).populate('user').exec()
}
socketSchema.statics.findBySocket = function(socket){
	return this.findOne({id:socket}).populate('user').exec()
}

module.exports = mongoose.model('Socket', socketSchema)