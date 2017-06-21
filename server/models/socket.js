"use strict"

const mongoose = require('mongoose')

const socketSchema = mongoose.Schema({
	id: String,
	heartbeat: {type:Date,expires:600},
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
})

socketSchema.statics.findByUser = function(user){
	return this.find({
		user: mongoose.Types.ObjectId(user._id)
	})
}

module.exports = mongoose.model('Show', socketSchema)