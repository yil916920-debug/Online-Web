const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const imageList = document.getElementById('imageList');
//按钮
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusText = document.getElementById('status');

let images = [];
let videoBlob = null;

    selectBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {

    e.preventDefault();

    uploadBox.classList.remove('dragover');

    handleFiles(e.dataTransfer.files);
});

function renderAllImages() {
    imageList.innerHTML = '';
    images.forEach((imgData, idx) => {
        renderImageItem(imgData, idx);
    });
}

document.addEventListener('languageChanged', () => {
    renderAllImages();
});

//添加这个，在撤销图片后，再次点击上传该图片可再次触发上传，进行上传
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);

    // 🔹 关键：清空 input 值，保证同一张文件可重复上传
    e.target.value = '';
});
function handleFiles(files) {
    [...files].forEach(file => {

        if (!file.type.startsWith('image/')) return;
        // ❗ 检查是否达到上传上限(最多只能上传10张图片)
       if (images.length >= 10) {
    Swal.fire({
        icon: 'warning',
        title: translations.uploadLimitTitle,
        text: translations.uploadLimitText,
        confirmButtonText: translations.okBtn,
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#6366f1'
    });
    return;
}

        // ❗ 防重复
        if (images.some(i => i.file.name === file.name)) return;

        const imageData = { file, duration: 3 };
        images.push(imageData);
    });

    renderAllImages(); // 重新渲染所有图片
}

function renderImageItem(imageData, index) {

    const url = URL.createObjectURL(imageData.file);

    const div = document.createElement('div');
    div.className = 'image-item';

    div.innerHTML = `
        <img src="${url}">
        <div class="image-info">
            <p>${imageData.file.name}</p>
            <label>${translations.durationLabel}</label>
            <input
                type="number"
                min="1"
                max="60"
                value="${imageData.duration}"
                data-index="${index}"
            >
        </div>
        <span class="remove-btn">×</span>
    `;

    imageList.appendChild(div);

    // 改变时长
    const input = div.querySelector('input');
    input.addEventListener('change', (e) => {
        let value = parseInt(e.target.value);
        if (value < 1) value = 1;
        if (value > 60) value = 60;
        images[index].duration = value;
    });

    // 删除按钮
    const removeBtn = div.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => {
        images.splice(index, 1);      // 从数组删除
        renderAllImages();             // 重新渲染
    });
}
/*设置一个全局的状态，在生成过程中切换语言时，同步进行翻译*/
   // 全局状态
let currentStatus = ''; // 'generating', 'success', 'fail'

// 更新状态文本函数
function updateStatusText() {
    if (!currentStatus) return;
    switch (currentStatus) {
    //不写死，“正在生成视频...”，加 fallback 防止报错
        case 'generating':
            statusText.innerText = translations.generating || 'Generating...';
            break;
    //生成成功
        case 'success':
            statusText.innerText = translations.success || 'Video generated!';
            break;
    //生成失败
        case 'fail':
            statusText.innerText = translations.fail || 'Video generation failed!';
            break;
    }
}

generateBtn.addEventListener('click', async () => {

  if (images.length === 0) {

    Swal.fire({
        icon: 'warning',
        title: translations.uploadWarningTitle,
        text: translations.uploadWarningText,
        confirmButtonText: translations.okBtn,
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#6366f1'
    });

    return;
}

 // 开始生成视频
    currentStatus = 'generating';
//    调用函数，进行全局状态更新
    updateStatusText();

    downloadBtn.style.display = 'none';

    const canvas = document.createElement('canvas');

    canvas.width = 1280;
    canvas.height = 720;

    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(30);

    const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
    });

    const chunks = [];

    recorder.ondataavailable = (e) => {
        chunks.push(e.data);
    };

    recorder.start();

  try {
        for (const item of images) {
            const img = new Image();
            img.src = URL.createObjectURL(item.file);
            await new Promise(r => img.onload = r);

            const startTime = Date.now();
            while (Date.now() - startTime < item.duration * 1000) {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (canvas.width - w) / 2;
                const y = (canvas.height - h) / 2;
                ctx.drawImage(img, x, y, w, h);
                await new Promise(r => setTimeout(r, 33));
            }
        }

        recorder.stop();

        recorder.onstop = () => {
            videoBlob = new Blob(chunks, { type: 'video/webm' });

            // 生成成功
            currentStatus = 'success';
            updateStatusText();

            downloadBtn.style.display = 'inline-block';

            // ⭐ 弹窗提示成功
            Swal.fire({
                icon: 'success',
                title: translations.videoSuccessTitle,
                text: translations.videoSuccessText,
                confirmButtonText: translations.okBtn,
                background: '#111827',
                color: '#fff',
                confirmButtonColor: '#6366f1'
            });
        };

    } catch (err) {
        currentStatus = 'fail';
        updateStatusText();

        Swal.fire({
            icon: 'error',
            title: translations.videoFailTitle,
            text: translations.videoFailText,
            confirmButtonText: translations.okBtn
        });
    }
});

downloadBtn.addEventListener('click', () => {

    if (!videoBlob) return;

    const a = document.createElement('a');

    a.href = URL.createObjectURL(videoBlob);

    a.download = 'output.webm';

    a.click();
});

console.log("浏览器语言:", navigator.language);
console.log("语言列表:", navigator.languages);