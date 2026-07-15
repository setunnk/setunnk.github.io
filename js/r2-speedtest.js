// js/r2-speedtest.js
document.addEventListener("DOMContentLoaded", function() {
    const titleEl = document.querySelector('.title');
    let currentNo = 706; // 默认防错期号
    
    // 从全局变量读取由 CF Pages 注入的 R2 目录名，如果读取不到则默认用 zrsetu_pic
    const r2Dir = (window.__CF_R2_CONFIG__ && window.__CF_R2_CONFIG__.r2Dir) || "zrsetu_pic";
    
    // 1. 动态解析期号并重写常规链接
    if (titleEl) {
        const match = titleEl.innerText.match(/\d+/);
        if (match) {
            currentNo = parseInt(match[0]);
            
            // 动态适配前一期链接的目录名前缀与下载页 ID 前缀（根据当前页面 URL 自动匹配）
            const currentPathname = window.location.pathname;
            let folderPrefix = "/zrsetu";
            let kvPrefix = "zrsetu"; // 动态匹配 KV 里的前缀类型

            if (currentPathname.startsWith("/setu")) {
                folderPrefix = "/setu";
                kvPrefix = "setu";
            } else if (currentPathname.startsWith("/acg")) {
                folderPrefix = "/acg";
                kvPrefix = "acg";
            }

            // 重写下一期/前一期链接
            const prevNo = currentNo - 1;
            const prevLink = document.getElementById('prev-link');
            if (prevLink) prevLink.href = `https://setutime.com${folderPrefix}/${prevNo}`;
            
            // 【核心修复】将原先写死的 zrsetu_ 改为动态的 ${kvPrefix}_
            const downloadUrl = `https://dl.setutime.com/support?id=${kvPrefix}_${currentNo}`;
            
            const topSaveBtn = document.querySelector('.save-blue');
            if (topSaveBtn) topSaveBtn.href = downloadUrl;
            
            const bottomSaveBtn = document.querySelector('.preserve');
            if (bottomSaveBtn) bottomSaveBtn.href = downloadUrl;
        }
    }

    // 2. 网络探测函数：测试是否能连通 R2 域名
    function checkR2Connectivity() {
        return new Promise((resolve) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                resolve(false);
            }, 1500); // 1.5秒超时
            
            fetch(`https://r2.setutime.com/ping.txt`, {
               method: 'HEAD',
               mode: 'cors',
               signal: controller.signal
            })
            .then(response => {
                clearTimeout(timeoutId);
                resolve(response.ok || response.status === 200 || response.status === 206);
            })
            .catch(() => {
                clearTimeout(timeoutId);
                resolve(false);
            });
        });
    }

    // 3. 执行核心图片链接重写与懒加载
    async function initGallery() {
        const isR2Available = await checkR2Connectivity();
        console.log(`R2 连通性测试结果: ${isR2Available}, 动态目录: ${r2Dir}`);

        const imgs = document.querySelectorAll('.img-wrap img');

        if (isR2Available) {
            imgs.forEach(img => {
                const originalSrc = img.dataset.src;
                if (originalSrc && originalSrc.includes('wdcdn.qpic.cn')) {
                    const index = img.getAttribute('alt');
                    if (index) {
                        // 这里的 r2Dir 是动态的，会自动变成 zrsetu_pic / setu_pic / acg_pic
                        img.dataset.src = `https://r2.setutime.com/${r2Dir}/pic-${currentNo}-${index}.webp`;
                    }
                }
            });
        }

        // 激活懒加载
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const wrap = img.parentElement;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.onload = () => { wrap.classList.add('loaded'); };
                        }
                        observer.unobserve(img);
                    }
                });
            }, { rootMargin: "0px 0px 300px 0px" });

            imgs.forEach(img => imageObserver.observe(img));
        } else {
            imgs.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.onload = () => img.parentElement.classList.add('loaded');
                }
            });
        }
    }

    initGallery();

    // 4. 悬浮按钮滚动隐藏逻辑
    const fixedBtn = document.querySelector('.fixed-button');
    if (fixedBtn) {
        let lastScrollY = window.scrollY;
        let ticking = false;

        function updateButtonVisibility() {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 10) {
                fixedBtn.classList.add('hidden');
            } else {
                fixedBtn.classList.remove('hidden');
            }
            lastScrollY = currentScrollY;
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateButtonVisibility);
                ticking = true;
            }
        });
    }
});