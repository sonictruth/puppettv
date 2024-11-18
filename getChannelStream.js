import { launch, getStream, wss } from "puppeteer-stream";
import { readFileSync } from "fs";

import config from './config.js';
import cookies from './cookies.js';

const css = readFileSync('./style.css', 'utf8');

const browser = await launch({
    headless: true,
    executablePath: config.executablePath,
    defaultViewport: config.defaultViewport,
    ignoreDefaultArgs: [
        '--disable-component-update',
        '--enable-automation'
    ],
    args: [
        '--disable-infobars',
        '--headless=new',
        '--no-sandbox',
        '--disable-setuid-sandbox'
    ]
});

export default async function getChannelStream(channel = 'ncn-tv') {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.setDefaultTimeout(0);
    await page.setCookie(...cookies);
    await page.goto('https://www.digionline.ro/stiri/' + channel);
    await page.addStyleTag({ content: css });
    const stream = await getStream(page, { audio: true, video: true });
    stream.on('close', () => {
        console.log('Page closed');
        page.close();
    });
    return stream;
}