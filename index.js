import getChannelStream from './getChannelStream.js';
import express from 'express';
import config from './config.js';
import log from './log.js';

const app = express();
const port = config.port;

app.get(`/stream/playlist.m3u`, (req, res) => {
    let m3uContent = '#EXTM3U\n';
    for (const channel of config.channels) {

        const streamUrl = `${config.publicPath}stream/${channel.id}` ;
        
        m3uContent += `#EXTINF:-1 TVG-TYPE=""${channel.group}"" TVG-GROUP=""${channel.group}"" TVG-ID=""${channel.id}"" TVG-NAME=""${channel.name}"" TVG-LOGO=""${channel.logo}"",${channel.name}\n`;
        m3uContent += `${streamUrl}\n`;
    }
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(m3uContent);
    const remoteIp = req.ip;
    log(`${remoteIp} fetching playlist`);
});

app.get('/stream/:channelId', async (req, res) => {
    try {
        const channelId = req.params.channelId;
        const remoteIp = req.ip;
        res.setHeader('Content-Type', 'video/webm');

        const stream = await getChannelStream(channelId);
        stream.pipe(res);

        log(`${remoteIp} fetching stream for channel: ${channelId}`);

        req.on('close', () => {
            log(`${remoteIp} closed connection ${channelId}`);
            stream.destroy();
        });

    } catch (error) {
        console.error('Error fetching stream:', error);
        res.status(500).send('Error fetching stream');
    }
})

app.listen(port, () => {
    log(`Listening  ${config.publicPath}stream/playlist.m3u`);
})

