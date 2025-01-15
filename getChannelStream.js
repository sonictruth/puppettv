import { launch, getStream, wss } from "puppeteer-stream";
import { readFileSync } from "fs";

import config from './config.js';
import cookies from './cookies.js';
import log from './log.js';
import https  from 'https';

const css = readFileSync('./style.css', 'utf8');

const keepAliveInterval = 30 * 60 * 1000;

const browser = await launch({
    headless: true,
    executablePath: config.executablePath,
    defaultViewport: config.defaultViewport,
    ignoreDefaultArgs: [
        '--disable-component-update',
        '--enable-automation',
        '--disable-gpu',
    ],
    args: [
        '--enable-gpu',
        '--disable-infobars',
        '--headless=new',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--use-gl=angle',
        '--use-angle=gl-egl',
        '--use-cmd-decoder=passthrough',
        '--ignore-gpu-blocklist',
    ]
});

export function keepAlive() {
    setInterval(() => {
        const options = {
            hostname: 'www.digionline.ro',
            path: '/stiri/digi24',
            method: 'GET',
            headers: {
                'Cookie': cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
            }
        };

        const req = https.request(options, (res) => {
            log('Keep-alive request successful: ' + res.statusCode);
        });

        req.on('error', (error) => {
            log('Keep-alive request failed: ' + error.message);
        });

        req.end();
    }, keepAliveInterval);
}

keepAlive();

export default async function getChannelStream(channelId = 'ncn-tv') {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.setDefaultTimeout(0);
    await page.setCookie(...cookies);
    await page.goto('https://www.digionline.ro/stiri/' + channelId);
    await page.addStyleTag({ content: css });
    const stream = await getStream(page, { 
        audio: true, video: true,
        mimeType: 'video/webm;codecs=H264,pcm',
        videoConstraints :{
            mandatory: {
                frameRate: { ideal: 20, max: 30 },
            },
        }
    });
    stream.on('close', () => {
        log(channelId + ' page closed');
        page.close();
    });
    return stream;
}