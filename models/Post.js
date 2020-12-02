const mongoose = require('mongoose');

// password security with dotenv
require('dotenv').config();

const url = process.env.MONGO_URL;
mongoose
	.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
	.then((result) => {
		console.log('connected to MongoDB');
	})
	.catch((error) => {
		console.log('error connecting to MongoDB:', error.message);
	});

const postSchema = new mongoose.Schema({
	title: String,
	content: String,
	author: String,
	date: Number,
});

// clear persons from versioning and id object
postSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		returnedObject.id = returnedObject._id.toString();
		delete returnedObject._id;
		delete returnedObject.__v;
	},
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
