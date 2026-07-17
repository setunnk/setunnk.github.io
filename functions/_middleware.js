export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 1. 精准路径匹配：只有属于 /setu/、/zrsetu/、/acg/ 目录下的具体文章页面才进行处理
  const isTargetPage = 
    /^\/setu\/.+/.test(pathname) || 
    /^\/zrsetu\/.+/.test(pathname) || 
    /^\/acg\/.+/.test(pathname);

  // 如果不匹配目标路径，直接放行，绝不修改任何内容
  if (!isTargetPage) {
    return context.next();
  }

  // 2. 获取原始页面响应
  const response = await context.next();
  
  // 兜底安全校验：如果不是 HTML 页面，也直接放行
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  // 3. 仅在匹配成功的文章页面中注入的双通道竞速 JS 逻辑
  const injectScript = `
<script>
document.addEventListener("DOMContentLoaded", function() {
    // 1. 获取当前分类的前缀
    function getR2CategoryPrefix() {
        const path = window.location.pathname;
        if (path.includes('/zrsetu')) return 'zrsetu_pic';
        if (path.includes('/setu')) return 'setu_pic';
        if (path.includes('/acg')) return 'acg_pic';
        return null;
    }

    // 2. 获取当前期号 (优先从标题提取，备用从 URL)
    function getIssueNumber() {
        const titleEl = document.querySelector('.title');
        if (titleEl) {
            const match = titleEl.innerText.match(/\\d+/);
            if (match) return match[0];
        }
        const pathMatch = window.location.pathname.match(/\\d+/);
        if (pathMatch) return pathMatch[0];
        return null;
    }

    const r2Prefix = getR2CategoryPrefix();
    const issueNo = getIssueNumber();

    // 3. 竞速加载核心函数，传入：图片元素、容器
    function raceLoadImage(img, wrap) {
        const defaultSrc = img.getAttribute('data-src');
        if (!defaultSrc) return;

        // 过滤头像或普通图标
        if (defaultSrc.includes('favicon') || defaultSrc.includes('qpic.cn')) {
            img.src = defaultSrc;
            img.onload = () => { wrap.classList.add('loaded'); };
            return;
        }

        // 直接获取 alt 属性作为图片序号
        const index = img.getAttribute('alt');

        // 构建 R2 目标链接
        let r2Src = null;
        if (r2Prefix && issueNo && index) {
            r2Src = "https://r2.setutime.com/" + r2Prefix + "/pic-" + issueNo + "-" + index + ".webp";
        }

        // 如果拼不出 R2 链接，退回到默认加载
        if (!r2Src) {
            img.src = defaultSrc;
            img.onload = () => { wrap.classList.add('loaded'); };
            return;
        }

        let hasLoaded = false;
        const tempDefaultImg = new Image();
        const tempR2Img = new Image();

        // 胜出者回调
        function onWinner(winnerSrc) {
            if (hasLoaded) return;
            hasLoaded = true;
            tempDefaultImg.onload = tempDefaultImg.onerror = null;
            tempR2Img.onload = tempR2Img.onerror = null;
            img.src = winnerSrc;
            img.onload = () => { wrap.classList.add('loaded'); };
        }

        let failCount = 0;
        function onError() {
            failCount++;
            if (failCount >= 2 && !hasLoaded) {
                img.src = defaultSrc;
                img.onload = () => { wrap.classList.add('loaded'); };
            }
        }

        tempDefaultImg.onload = () => onWinner(defaultSrc);
        tempDefaultImg.onerror = onError;
        tempR2Img.onload = () => onWinner(r2Src);
        tempR2Img.onerror = onError;

        tempDefaultImg.src = defaultSrc;
        tempR2Img.src = r2Src;
    }

    // 获取所有待加载的图片
    const imgs = document.querySelectorAll('.img-wrap img');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const wrap = img.parentElement;
                    raceLoadImage(img, wrap);
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: "0px 0px 5000px 0px" }); // 5000px 快速滚动防白屏缓冲

        imgs.forEach(img => imageObserver.observe(img));
    } else {
        imgs.forEach(img => {
            raceLoadImage(img, img.parentElement);
        });
    }

    // --- 处理“下一期链接”、“保存按钮”和“底部悬浮按钮”的逻辑 ---
    const titleEl = document.querySelector('.title');
    if (titleEl) {
        const match = titleEl.innerText.match(/\\d+/);
        if (match) {
            const currentNo = parseInt(match[0]);
            const prevNo = currentNo - 1;
            const prevLink = document.getElementById('prev-link');
            if (prevLink) {
                prevLink.href = \`https://setutime.com/zrsetu/\${prevNo}\`;
            }
            const downloadUrl = \`https://dl.setutime.com/support?id=zrsetu_\${currentNo}\`;
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
</script>
`;

  // 4. 使用 HTMLRewriter（仅对目标文章页面生效）
  //    - 移除原本自带的那个含有懒加载的旧 <script> 标签
  //    - 在 </body> 结束前注入全新合并后的新 <script>
  return new HTMLRewriter()
    .on("script", {
      element(element) {
        element.remove();
      }
    })
    .on("body", {
      element(element) {
        element.append(injectScript, { html: true });
      }
    })
    .transform(response);
}