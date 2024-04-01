const imageListContainer = document.getElementById('image-list-container');

imageListContainer.addEventListener('click', async (event) => {
    const imagePaths = await window.electronAPI.openFileDialog();

    imagePaths.forEach(path => {
        // const imageName = path.split(/(\\|\/)/g).pop(); // 从路径获取文件名
        // addImageToList(imageName, 'Waiting');
        addImageToList(path, '');
    });
});

imageListContainer.addEventListener('dragover', (event) => {
    event.preventDefault(); // 阻止默认行为
    imageListContainer.style.backgroundColor = '#f0f0f0'; // 可选：提供视觉反馈
});

imageListContainer.addEventListener('dragleave', (event) => {
    imageListContainer.style.backgroundColor = ''; // 恢复原始背景色
});

imageListContainer.addEventListener('drop', (event) => {
    event.preventDefault();
    imageListContainer.style.backgroundColor = ''; // 恢复原始背景色

    const files = Array.from(event.dataTransfer.files);

    files.forEach(file => {
        if (file.type.match('image.*')) { // 确保是图片文件
            addImageToList(file.path, '');
        }
    });
});

function addImageToList(name, status) {
    const imageList = document.getElementById('image-list');
    const listItem = document.createElement('li');
    listItem.innerHTML = `${name} <span>${status}</span>`;
    imageList.appendChild(listItem);
}

document.getElementById('browse-directory').addEventListener('click', async () => {
    const directory = await window.electronAPI.openDirectoryDialog();
    if (directory) {
        document.getElementById('output-directory').value = directory;
    }
});

document.getElementById('process-button').addEventListener('click', async () => {
    const imageList = document.getElementById('image-list').children;
    const outputDirectory = document.getElementById('output-directory').value;

    if (!outputDirectory) {
        alert('请选择输出目录');
        return;
    }

    for (const item of imageList) {
        const imageFilePath = item.textContent.trim().split(' ')[0];
        const statusElement = item.querySelector('span');

        console.log('Processing image:', imageFilePath);

        try {
            statusElement.textContent = 'Processing...';

            // 调用主进程方法处理图片
            const outputPath = await window.electronAPI.processImage(imageFilePath, outputDirectory);

            if (outputPath) {
                statusElement.textContent = 'Completed';
            } else {
                statusElement.textContent = 'Error';
            }
        } catch (error) {
            console.error('Error processing image:', error);
            statusElement.textContent = 'Status: Error';
        }
    }
});

document.getElementById('upload').addEventListener('click', async () => {
    const path = await window.electronAPI.openFileDialog();
    if (path) {
        const metadata = await window.electronAPI.getMetadata(path);
        document.getElementById('metadata').textContent = JSON.stringify(metadata, null, 2);

        // 调用主进程函数来将元数据写入图片
        const outputPath = await window.electronAPI.writeMetadataToImage({ path, metadata });
        console.log('Processed image saved to:', outputPath);
    }
});
