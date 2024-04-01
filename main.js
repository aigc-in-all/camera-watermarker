const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('fs');
const exifParser = require('exif-parser');
const sharp = require('sharp');
const moment = require('moment');

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile('index.html')

    ipcMain.handle('open-file-dialog', async (event) => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'Images', extensions: ['jpg', 'jpeg'] }]
        });
        if (result.canceled) {
            return [];
        } else {
            return result.filePaths;
        }
    });

    ipcMain.handle('open-directory-dialog', async (event) => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (result.canceled) {
            return '';
        } else {
            return result.filePaths[0];
        }
    });

    ipcMain.handle('process-image', async (event, imageFilePath, outputDirectory) => {
        try {
            const imageName = imageFilePath.split(/(\\|\/)/g).pop()
            const outputPath = path.join(outputDirectory, imageName);

            // 在这里调用处理图片的函数，比如sharp处理逻辑
            // 例如，将图片处理逻辑放在一个函数processImage中，并在这里调用
            await processImage(imageFilePath, outputPath);

            return outputPath;
        } catch (error) {
            console.error('Error processing image:', error);
            return null;
        }
    });

    async function processImage(imageFilePath, outputPath) {
        const data = fs.readFileSync(imageFilePath);
        const parser = exifParser.create(data);
        const metadata = parser.parse().tags;

        const image = sharp(imageFilePath);
        const imageMetadata = await image.metadata();

        const barHeight = 140; // 底栏的高度，可以根据需要调整
        const width = imageMetadata.width;
        const fontSize = 60; // 字体大小，可以根据需要调整
        const textYPosition = barHeight / 2 + fontSize / 2 - 10; // 垂直居中文本 10表示偏移量，看上去会更居中些
        const fontFamily = "Arial"; // 字体，可以根据需要调整，例如："Times New Roman

        // 构建显示信息
        const createDateTimestamp = metadata.CreateDate ? parseInt(metadata.CreateDate, 10) * 1000 : null;
        const createDate = createDateTimestamp ? moment(createDateTimestamp).format('YYYY.MM.DD HH:mm:ss') : 'Unknown Date';
        const makeModel = (metadata.Make || 'Unknown Make') + ' ' + (metadata.Model || 'Unknown Model');
        const cameraInfo = (metadata.FocalLength ? `${metadata.FocalLength}mm` : '') +
            (metadata.FNumber ? ` f/${metadata.FNumber}` : '') +
            (metadata.ExposureTime ? ` ${exposureTimeToString(metadata.ExposureTime)}s` : '') +
            (metadata.ISO ? ` ISO${metadata.ISO}` : '');

        const svgOverlay = `<svg width="${width}" height="${barHeight}">
            <rect x="0" y="0" width="${width}" height="${barHeight}" font-family="${fontFamily}" fill="rgba(0, 0, 0, 0.1)" />
            <text x="100" y="${textYPosition}" font-size="${fontSize}" font-family="${fontFamily}" fill="gold">${createDate}</text>
            <text x="${width / 2}" y="${textYPosition}" font-size="${fontSize}" font-family="${fontFamily}" fill="gold" text-anchor="middle">${makeModel}</text>
            <text x="${width - 100}" y="${textYPosition}" font-size="${fontSize}" font-family="${fontFamily}" fill="gold" text-anchor="end">${cameraInfo}</text>
            </svg>`;

        await image
            // .extend({ // extend不支持透明度
            //     bottom: barHeight,
            //     background: { r: 0, g: 0, b: 0, alpha: 1 }
            // })
            .composite([{
                input: Buffer.from(svgOverlay),
                gravity: 'south'
            }])
            .jpeg({ quality: 90 })
            .toFile(outputPath);
    }

    function exposureTimeToString(value) {
        // 如果曝光时间大于1，直接返回该值的字符串表示
        if (value > 1) {
            return value.toString();
        }

        // 如果曝光时间小于等于1，转换为分数
        const fraction = 1 / value;
        const rounded = Math.round(fraction);
        return `1/${rounded}`;
    }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    app.quit()
})