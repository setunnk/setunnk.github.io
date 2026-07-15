// js/r2-speedtest.js
document.addEventListener("DOMContentLoaded", function() {
    // 1. 获取当前页面期号（从页面标题解析）
    const titleEl = document.querySelector('.title');
    let currentNo = null; // 默认为空，不再使用 706 兜底
    if (titleEl) {
        const match = titleEl.innerText.match(/\d+/);
        if (match) {
            currentNo = parseInt(match[0]);
        }
    }
    
    // 从全局变量读取由 CF Pages 注入的 R2 目录名，如果读取不到则为 null，不再使用 zrsetu_pic 兜底
    const r2Dir = (window.__CF_R2_CONFIG__ && window.__CF_R2_CONFIG__.r2Dir) || null;
    
    // 2. 检查是否具备 R2 替换的基本条件（必须同时拥有解析出的期号与 R2 目录名）
    const canUseR2 = currentNo !== null && r2Dir !== null;

    // 3. 网络探测函数：测试是否能连通 R2 域名
    function checkR2Connectivity() {
        return new Promise((resolve) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                resolve(false);
            }, 1500); // 1.5秒超时限制
            
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

    // 4. 创建图片加载监控器 (处理 5 秒超时与加载失败回退)
    const imgObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'src') {
                const img = mutation.target;
                const currentSrc = img.src;
                const r2Target = img.dataset.r2Target;
                const originalSrc = img.dataset.originalSrc;
                
                // 当图片的 src 被修改为 R2 地址时，启动监控
                if (currentSrc === r2Target && originalSrc && !img.dataset.monitored) {
                    img.dataset.monitored = "true"; // 标记避免重复绑定

                    let timeoutId = setTimeout(() => {
                        if (!img.complete) {
                            console.warn(`[R2] 图片加载超时 (超出 5 秒)，正在回退到默认地址: ${img.alt}`);
                            rollback();
                        }
                    }, 5000); // 5秒超时设定

                    const rollback = () => {
                        clearTimeout(timeoutId);
                        img.src = originalSrc;
                        img.dataset.src = originalSrc; // 确保懒加载库不会再次覆盖
                        cleanup();
                    };

                    const onLoad = () => {
                        clearTimeout(timeoutId);
                        cleanup();
                    };

                    const onError = () => {
                        console.warn(`[R2] 图片加载失败，已回退到默认地址: ${img.alt}`);
                        rollback();
                    };

                    const cleanup = () => {
                        img.removeEventListener('load', onLoad);
                        img.removeEventListener('error', onError);
                        delete img.dataset.monitored;
                    };

                    img.addEventListener('load', onLoad);
                    img.addEventListener('error', onError);
                }
            }
        });
    });

    // 5. 后台静默检测与升级
    if (canUseR2) {
        checkR2Connectivity().then(isR2Available => {
            console.log(`R2 连通性测试结果: ${isR2Available}, 动态目录: ${r2Dir}`);
            
            if (isR2Available) {
                const imgs = document.querySelectorAll('.img-wrap img');
                imgs.forEach(img => {
                    const originalSrc = img.dataset.src || img.src;
                    
                    // 如果当前还是默认的腾讯云链接，则准备替换为 R2 链接
                    if (originalSrc && originalSrc.includes('wdcdn.qpic.cn')) {
                        const index = img.getAttribute('alt');
                        if (index) {
                            const r2Url = `https://r2.setutime.com/${r2Dir}/pic-${currentNo}-${index}.webp`;
                            
                            // 备份默认地址与 R2 目标地址到 dataset 中
                            img.dataset.originalSrc = originalSrc;
                            img.dataset.r2Target = r2Url;

                            // 启动属性监听器（无论是现在立刻加载还是等懒加载触发，都能被捕获）
                            imgObserver.observe(img, { attributes: true, attributeFilter: ['src'] });
                            
                            // 更新 data-src 确保还未滚动到的图片在进入可视区时请求 R2 源
                            img.dataset.src = r2Url; 
                            
                            // 如果该图已经滚动到可视区并加载完成了，无缝将其 src 替换为高清 R2 链接
                            if (img.src && img.src.includes('wdcdn.qpic.cn')) {
                                img.src = r2Url;
                            }
                        }
                    }
                });
            }
        }).catch(err => {
            console.log("R2 检测发生异常，已保持模板默认的 wdcdn 加载模式", err);
        });
    } else {
        console.log("未读取到期号或R2配置目录，直接保持默认的腾讯云 wdcdn 加载模式");
    }
});