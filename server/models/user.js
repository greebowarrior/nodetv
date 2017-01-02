"use strict";

const bcrypt = require('bcrypt-nodejs');
const mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
	username: {
		type: String, required: true, trim: true
	},
	password: {
		type: String, required: true
	},
	email: {
		type: String, lowercase: true, trim: true
	},
	tokens: [{
		_id: false,
		created: {type: Date, default: new Date()},
		token: String
	}],
	trakt: {
		access_token: String,
		expires: Date,
		refresh_token: String
	},
	profile: Object,
	added: {
		type: Date, default: new Date()
	},
	updated: {
		type: Date, default: new Date()
	}
});

userSchema.statics.findByToken = function(username,token){
	return this.find({
		'username': username, 'tokens.token': token
	});
};
userSchema.statics.findByUsername = function(username){
	return this.find({
		'username': username
	});
};

userSchema.methods.apiToken = function(){
	if (!this.tokens.length){
		var token = {
			token: require('node-uuid').v4(),
			created: new Date()
		};
		this.tokens.push(token);
	}
	return this.tokens[this.tokens.length-1].token;
}

userSchema.methods.generateHash = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

userSchema.methods.verifyPassword = function(password){
	try {
		return bcrypt.compareSync(password, this.password);
	} catch(e){
		console.error(e);
		return false;
	}
};

userSchema.pre('save', function(next){
	this.updated = new Date();
	next();
});

module.exports = mongoose.model('User', userSchema);