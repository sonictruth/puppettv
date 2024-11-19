import { launch, getStream, wss } from "puppeteer-stream";
import { readFileSync } from "fs";

import config from './config.js';
import cookies from './cookies.js';
import log from './log.js';

const css = readFileSync('./style.css', 'utf8');

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
                frameRate: 5,
            },
            optional: {
                frameRate: 5,
            }
        }
    });
    stream.on('close', () => {
        log(channelId + ' page closed');
        page.close();
    });
    return stream;
}