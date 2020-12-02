const express = require('express');
const { readFile } = require('fs').promises;
const app = express();
const Post = require('./models/Post');
const scraper = require('./thorScraper');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('build'));

function logger(req, res, next) {
	console.log(
		`request fired to: '${req.url}', Method: '${req.method}', at: ${
			new Date().toString().split('GMT')[0]
		}`
	);
	next();
}
app.use(logger);

// get endpoint
app.get('/api/posts', async (req, res, next) => {
	let data = await Post.find();
	res.json({ data });
	// don't forget: catch((error) => next(error));
});

// app.get('/api/posts', async (req, res, next) => {
// 	// await scrapeData();
// 	let data = await readFile('data.json', 'utf8');
// 	data = JSON.parse(data);
// 	res.json({ data });
// 	// don't forget: catch((error) => next(error));
// });

/// ERRORS SECTION

const unknownEndpointHandler = (request, response) => {
	response.status(404).send({ error: 'unknown endpoint' });
};

// handler of requests with unknown endpoint
app.use(unknownEndpointHandler);

const errorHandler = (error, request, response, next) => {
	console.error(error.message);

	// build here your error handler

	next(error);
};

// handler of requests with result to errors
app.use(errorHandler);

module.exports = app;
