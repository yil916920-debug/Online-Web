// 当前语言
let currentLanguage =
    localStorage.getItem('language') || 'zh';

// 当前翻译
let translations = {};

// 加载语言文件
async function loadLanguage(lang) {

    try {

        const response =
            await fetch(`./locales/${lang}.json`);

        translations = await response.json();

        updatePageText();

        localStorage.setItem('language', lang);

        document.documentElement.lang = lang;

         // ⭐⭐⭐关键：重新渲染动态内容
        const event = new Event('languageChanged');
       document.dispatchEvent(event);

    } catch (error) {

        console.error('语言文件加载失败:', error);

    }

}

// 更新页面文字
function updatePageText() {

     document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) el.innerText = translations[key];
    });

   document.title = translations.title || 'Video Generator';

    // ⭐ 更新动态状态文本
    updateStatusText();

    // 如果有动态渲染图片，也重新渲染
    const event = new Event('languageChanged');
       document.dispatchEvent(event);

}

// 页面初始化
window.addEventListener('DOMContentLoaded', () => {

    const languageSelect =
        document.getElementById('languageSelect');

    // 设置默认值
    languageSelect.value = currentLanguage;

    // 初始化语言
    loadLanguage(currentLanguage);

    // 切换语言
    languageSelect.addEventListener('change', e => {

        currentLanguage = e.target.value;

        loadLanguage(currentLanguage);

    });

});