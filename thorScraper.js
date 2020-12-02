require('dotenv').config();
const puppeteer = require('puppeteer');
const Post = require('./models/Post');
const timeStamp = require('./helpers/timeStamp');

// const LOCAL_URL =
// 	'file:///C:/Users/moran/Documents/GitHub/scraping-final/onion.html';

// const LOCAL_URL2 =
// 	'file:///C:/Users/moran/Documents/GitHub/scraping-final/onion2.html';

const REAL_URL = process.env.SCRAPE_URL;

const scrapeData = async () => {
	try {
		// for later use, to filter posts and prevent duplicates
		const postsCount = await Post.find().countDocuments();
		const latestPost = await Post.find().sort({ date: -1 }).limit(1);
		const latestDate = latestPost.date;

		const browser = await puppeteer.launch({
			// headless: false,
			args: ['--proxy-server=socks5://127.0.0.1:9050'],
		});

		const page = await browser.newPage();
		await page.goto(REAL_URL);

		await page.waitForSelector('div[class="col-sm-12"]');
		let postsDiv = await page.$$('div[class="col-sm-12"]');

		postsDiv = postsDiv.slice(1, postsDiv.length - 1);

		let postsArr = [];
		for (let row of postsDiv) {
			const results = {};

			await page.waitForSelector('div[class="col-sm-5"] > h4');
			const pasteTitle = await row.$('div[class="col-sm-5"] > h4');

			// getting title element
			const propertyTitle = await pasteTitle.getProperty('innerText');
			let jsonPropertyTitle = await propertyTitle.jsonValue(); // convert it to json
			// filter unnecessary spaces
			jsonPropertyTitle = jsonPropertyTitle
				.split(' ')
				.filter(
					(word) =>
						word !== '' || word !== ' ' || word !== String.fromCharCode(160)
				)
				.join(' ');
			results.title = jsonPropertyTitle;

			// getting content element
			await page.waitForSelector('div[class="text"]');
			const pasteContent = await row.$('div[class="text"]');
			const propertyContent = await pasteContent.getProperty('innerText');
			let jsonPropertyContent = await propertyContent.jsonValue();
			// filter unnecessary spaces
			jsonPropertyContent = jsonPropertyContent
				.split(' ')
				.filter(
					(word) =>
						word !== '' || word !== ' ' || word !== String.fromCharCode(160)
				)
				.join(' ');
			results.content = jsonPropertyContent;

			// getting date and writer element
			const pasteDateAuthor = await row.$('div[class="col-sm-6"]');
			const propertyDateAuthor = await pasteDateAuthor.getProperty('innerText');
			const jsonPropertyDateAuthor = await propertyDateAuthor.jsonValue();
			results.author = jsonPropertyDateAuthor.split(' at ')[0].split(' ')[2];
			results.date = new Date(
				jsonPropertyDateAuthor.split(' at ')[1]
			).getTime();

			postsArr.push(results);
		}

		// filter posts to prevent duplicates
		postsArr = postsArr
			.filter((post) => {
				return post.date > latestDate;
			})
			.sort((postA, postB) => postB.date - postA.date);

		// write to DB only if there are new posts
		if (postsArr.length > 0) {
			await Post.insertMany(postsArr);
		}

		// logging info
		console.log(`finished scrape at: ${timeStamp(Date.now())}`);
		console.log('new posts count: ', postsArr.length);
		console.log('updated data count: ', postsCount);

		await browser.close();
		return true;
	} catch (err) {
		console.log('there was an error: ', err.message);
		return false;
	}
};

// because setTimeout cant get async function
const timeout = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

const scrapeInterval = async (lastScrape = true, ms = 1000 * 60 * 2) => {
	console.log(`started scrape at: ${timeStamp(Date.now())}`);
	// defaluts to 2 minutes
	const isScraped = await scrapeData();
	if (!lastScrape && !isScraped) {
		console.log(`run again in ${ms / 1000 / 60} minutes`);
		await timeout(ms);
		return scrapeInterval(isScraped, 1000 * 60 * 10); // called after 1/2 hour to prevent overload on server
	} else {
		console.log(`run again in ${ms / 1000 / 60} minutes`);
		await timeout(ms);
		return scrapeInterval(isScraped);
	}
};
scrapeInterval();
