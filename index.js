import getChannelStream from './getChannelStream.js';
import express from 'express';
import config from './config.js';

const app = express();
const port = config.port;

app.get('/playlist.m3u', (req, res) => {
    let m3uContent = '#EXTM3U\r\n';
    for (const channel of config.channels) {
        const streamUrl = `http://${req.headers.host}/stream/` + channel.id;
        m3uContent += '#EXTINF:-1,' + channel.name + '\r\n';
        m3uContent += streamUrl + '\r\n';
    }
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(m3uContent);
});

app.get('/stream/:channelId', async (req, res) => {
    try {
        const channelId = req.params.channelId;

        res.setHeader('Content-Type', 'video/webm');

        const stream = await getChannelStream(channelId);
        stream.pipe(res);

        req.on('close', () => {
            console.log('Connection closed');
            stream.destroy();
        });

    } catch (error) {
        console.error('Error fetching stream:', error);
        res.status(500).send('Error fetching stream');
    }
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

