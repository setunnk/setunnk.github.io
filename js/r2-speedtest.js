document.addEventListener("DOMContentLoaded", function() {
    const titleEl = document.querySelector('.title');
    let currentNo = null;
    if (titleEl) {
        const match = titleEl.innerText.match(/\d+/);
        if (match) {
            currentNo = parseInt(match[0]);
        }
    }
    
    const r2Dir = (window.__CF_R2_CONFIG__ && window.__CF_R2_CONFIG__.r2Dir) || null;
    
    const canUseR2 = currentNo !== null && r2Dir !== null;
    if (!canUseR2) {
        console.log("未读取到期号或R2配置目录，保持页面默认图床加载模式");
        return;
    }

    let isR2Downgraded = false;
    const imgs = document.querySelectorAll('.img-wrap img');

    function downgradeToDefaultImages() {
        if (isR2Downgraded) return;
        isR2Downgraded = true;
        console.warn("[R2 机制] 触发全局回退！全盘切换回默认图床。");

        imgs.forEach(img => {
            const originalSrc = img.dataset.originalSrc;
            if (originalSrc) {
                img.dataset.src = originalSrc;
                if (img.src && img.src.includes('r2.setutime.com')) {
                    img.src = originalSrc;
                }
            }
        });
    }

    function checkR2Connectivity() {
        return new Promise((resolve) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                resolve(false);
            }, 3000);
            
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

    checkR2Connectivity().then(isR2Available => {
        console.log(`R2 连通性测试结果: ${isR2Available}, 动态目录: ${r2Dir}`);
        
        if (!isR2Available) {
            downgradeToDefaultImages();
            return;
        }
        
        imgs.forEach(img => {
            const originalSrc = img.dataset.src || img.src;
            
            if (originalSrc && !originalSrc.includes('r2.setutime.com')) {
                const index = img.getAttribute('alt');
                if (index) {
                    const r2Url = `https://r2.setutime.com/${r2Dir}/pic-${currentNo}-${index}.webp`;
                    
                    img.dataset.originalSrc = originalSrc;

                    let imageTimeout = setTimeout(() => {
                        if (!img.complete && img.src === r2Url) {
                            console.warn(`[R2] 单张图片加载超 3 秒: ${img.alt}，执行全局回退。`);
                            downgradeToDefaultImages();
                        }
                    }, 3000);

                    img.onerror = function() {
                        if (img.src === r2Url) {
                            console.warn(`[R2] 单张图片加载失败: ${img.alt}，执行全局回退。`);
                            clearTimeout(imageTimeout);
                            downgradeToDefaultImages();
                        }
                    };

                    img.onload = function() {
                        clearTimeout(imageTimeout);
                    };
                    
                    img.dataset.src = r2Url; 
                    
                    if (img.src && img.src === originalSrc) {
                        img.src = r2Url;
                    }
                }
            }
        });
    }).catch(err => {
        console.error("R2 检测异常，全盘保持默认加载模式", err);
        downgradeToDefaultImages();
    });
});