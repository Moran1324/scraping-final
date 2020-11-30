const puppeteer = require('puppeteer');
const { readFile, writeFile } = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const LOCAL_URL =
	'file:///C:/Users/moran/Documents/GitHub/scraping-final/onion.html';
const LOCAL_URL2 =
	'file:///C:/Users/moran/Documents/GitHub/scraping-final/onion2.html';
const REAL_URL = 'http://nzxj65x32vh2fkhk.onion/all';

(async () => {
	let data = await readFile('data.json', 'utf8');
	let latestDate = 0;

	if (data.length) {
		data = JSON.parse(data);
		data.forEach((paste) => {
			if (paste.date > latestDate) {
				latestDate = paste.date;
			}
		});
	} else {
		data = [];
	}
	const browser = await puppeteer.launch({
		headless: false,
		args: ['--proxy-server=socks5://127.0.0.1:9050'],
	});

	const page = await browser.newPage();
	await page.goto(REAL_URL);

	await page.waitForSelector('div[class="col-sm-12"]');
	let pastesDiv = await page.$$('div[class="col-sm-12"]');

	pastesDiv = pastesDiv.slice(1, pastesDiv.length - 1);

	let pastesArr = [];
	for (let row of pastesDiv) {
		const results = {};

		results.id = uuidv4();

		await page.waitForSelector('div[class="col-sm-5"] > h4');
		const pasteTitle = await row.$('div[class="col-sm-5"] > h4');

		const propertyTitle = await pasteTitle.getProperty('innerText');
		const jsonPropertyTitle = await propertyTitle.jsonValue();
		results.title = jsonPropertyTitle;

		await page.waitForSelector('div[class="text"]');
		const pasteContent = await row.$('div[class="text"]');
		const propertyContent = await pasteContent.getProperty('innerText');
		const jsonPropertyContent = await propertyContent.jsonValue();
		results.content = jsonPropertyContent;

		const pasteDateAuthor = await row.$('div[class="col-sm-6"]');
		const propertyDateAuthor = await pasteDateAuthor.getProperty('innerText');
		const jsonPropertyDateAuthor = await propertyDateAuthor.jsonValue();
		results.author = jsonPropertyDateAuthor.split(' at ')[0].split(' ')[2];
		results.date = new Date(jsonPropertyDateAuthor.split(' at ')[1]).getTime();

		pastesArr.push(results);
	}
	pastesArr = pastesArr.filter((paste) => {
		return paste.date > latestDate;
	});
	data.push(...pastesArr);
	await writeFile('data.json', '');
	await writeFile('data.json', JSON.stringify(data));

	console.log(
		'pastesArr=================================================',
		pastesArr.length
	);
	console.log(
		'data======================================================',
		data.length
	);

	await browser.close();
})();
