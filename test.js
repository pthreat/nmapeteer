const puppeteer = require('puppeteer');
log = process.argv[2],
	fs = require('fs'),
	xml2js = require('xml2js'),
	util = require('util');

process.setMaxListeners(0);

async function loadFile (file) {

	return new Promise((resolve, reject) => {
		fs.readFile(file, function (err, data) {
			let ret = [],
				xmlParser = new xml2js.Parser();

			xmlParser.parseString(data, function (err, result) {
				result.nmaprun.host.map(item => {
					let addr = item.address[0]['$'].addr,
						ports = item.ports[0].port;
					ports.map(port => {
						let state = port.state[0]['$'].state,
							number = port['$'].portid,
							proto = port.service[0]['$'].name;

						if (proto === 'http-proxy') {
							proto = 'http';
						}

						if ('open' !== state) {
							return;
						}

						ret.push({
							addr: addr,
							proto: proto,
							number: number
						});

					});

				});

			});

			return resolve(ret);

		});

	});

}

async function navigate(url, output){

	let args = {
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--ignore-certificate-errors'
		]
	};

	const browser = await puppeteer.launch(args);

	try {
		const page = await browser.newPage();
		await page.goto(url, {timeout: 100000});
		await page.screenshot({path: output});
		await browser.close();
	}catch(error){
		browser.close();
	}finally{
		browser.close();
	}
}

loadFile(log)
	.then(async hosts => {

		for (let i = 0; i < hosts.length; i++) {
			let host = hosts[i],
				addr = host.addr,
				proto = host.proto,
				screenshot = './screenshots/' + proto + '_' + addr + '.png';

			let url = proto + '://' + addr;
			console.log('Navigate to: ', url);
			await navigate(url, screenshot);
			console.log('END');
		}

	});
