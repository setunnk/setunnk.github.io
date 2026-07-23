document.addEventListener("DOMContentLoaded", function() {
    // 1. 图片懒加载 (IntersectionObserver)
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

        const imgs = document.querySelectorAll('.img-wrap img');
        imgs.forEach(img => imageObserver.observe(img));
    } else {
        const imgs = document.querySelectorAll('.img-wrap img');
        imgs.forEach(img => {
            img.src = img.dataset.src;
            img.onload = () => img.parentElement.classList.add('loaded');
        });
    }

    // 2. 根据 URL 识别分类 & 动态生成下一期与下载链接
    const path = window.location.pathname;
    let category = 'setu'; // 默认分类

    if (path.includes('/zrsetu/')) {
        category = 'zrsetu';
    } else if (path.includes('/acg/')) {
        category = 'acg';
    } else if (path.includes('/setu/')) {
        category = 'setu';
    }

    const titleEl = document.querySelector('.title');
    if (titleEl) {
        const match = titleEl.innerText.match(/\d+/);
        if (match) {
            const currentNo = parseInt(match[0], 10);
            const prevNo = currentNo - 1;
            
            // 设置下一期/上一期链接
            const prevLink = document.getElementById('prev-link');
            if (prevLink) {
                prevLink.href = `https://www.setutime.com/${category}/${prevNo}`;
            }

            // 设置下载链接
            const downloadUrl = `https://dl.setutime.com/support?id=${category}_${currentNo}`;
            const topSaveBtn = document.querySelector('.save-blue');
            if (topSaveBtn) {
                topSaveBtn.href = downloadUrl;
            }
            const bottomSaveBtn = document.querySelector('.preserve');
            if (bottomSaveBtn) {
                bottomSaveBtn.href = downloadUrl;
            }
        }
    }

    // 3. 底部悬浮按钮滚动显隐控制
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