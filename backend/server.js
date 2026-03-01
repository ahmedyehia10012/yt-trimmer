const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Custom yt-dlp wrapper to avoid python dependency issues
const youtubeDl = async (url, options = {}) => {
    let args = [url];
    if (options.dumpJson) args.push('--dump-json');
    if (options.noWarnings) args.push('--no-warnings');
    if (options.noCheckCertificate) args.push('--no-check-certificate');

    // Command can be yt-dlp or python3 -m yt_dlp
    const command = `yt-dlp ${args.join(' ')}`;
    const { stdout } = await execPromise(command, { maxBuffer: 1024 * 1024 * 10 });
    return JSON.parse(stdout);
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the frontend build
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(FRONTEND_DIST)) {
    console.log('Serving frontend from:', FRONTEND_DIST);
    app.use(express.static(FRONTEND_DIST));
} else {
    console.log('Frontend dist folder NOT found at:', FRONTEND_DIST);
}

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

// Redirect all non-API GET requests to index.html for React SPA
app.get(/^(?!\/api).*$/, (req, res) => {
    if (fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))) {
        res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    } else {
        res.send('Frontend Not Built. Run npm run build.');
    }
});

// Get video info
app.get('/api/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const info = await youtubeDl(url, {
            dumpJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
        });

        // Filter formats for video + audio
        const formats = info.formats
            .filter(f => f.vcodec !== 'none' && f.acodec === 'none' && f.ext === 'mp4')
            .map(f => ({
                format_id: f.format_id,
                resolution: f.resolution,
                height: f.height,
                ext: f.ext,
                filesize: f.filesize,
            }))
            .sort((a, b) => b.height - a.height);

        res.json({
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            formats: formats,
        });
    } catch (error) {
        console.error('Error fetching info:', error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

// Download and trim
app.get('/api/download', async (req, res) => {
    const { url, start, end, quality } = req.query;
    if (!url || !start || !end) return res.status(400).json({ error: 'Missing parameters' });

    const startTime = parseFloat(start);
    const endTime = parseFloat(end);
    const duration = endTime - startTime;

    if (duration <= 0) return res.status(400).json({ error: 'Invalid duration' });

    try {
        // Get high quality video and audio URLs
        const info = await youtubeDl(url, {
            dumpJson: true,
        });

        // Select the best video format for the requested height
        let videoFormat = info.formats
            .filter(f => f.vcodec !== 'none' && f.acodec === 'none' && (!quality || f.height <= parseInt(quality)))
            .sort((a, b) => b.height - a.height)[0];

        // Select the best audio format
        let audioFormat = info.formats
            .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
            .sort((a, b) => b.abr - a.abr)[0];

        if (!videoFormat || !audioFormat) {
            return res.status(500).json({ error: 'Could not find suitable formats' });
        }

        const outputFilename = `trimmed_${uuidv4()}.mp4`;
        const outputPath = path.join(TEMP_DIR, outputFilename);

        console.log(`Trimming ${info.title} from ${start} to ${end}...`);

        ffmpeg()
            .input(videoFormat.url)
            .inputOptions([`-ss ${startTime}`])
            .input(audioFormat.url)
            .inputOptions([`-ss ${startTime}`])
            .outputOptions([
                `-t ${duration}`,
                '-c:v libx264',
                '-preset superfast',
                '-crf 28',
                '-c:a aac',
                '-b:a 128k',
                '-movflags +faststart'
            ])
            .toFormat('mp4')
            .on('start', (command) => console.log('FFmpeg started:', command))
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                res.status(500).send('Processing failed');
            })
            .on('end', () => {
                console.log('FFmpeg finished processing');
                res.download(outputPath, `${info.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`, (err) => {
                    if (err) console.error('Download error:', err);
                    // Cleanup
                    fs.unlinkSync(outputPath);
                });
            })
            .save(outputPath);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to process video' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
