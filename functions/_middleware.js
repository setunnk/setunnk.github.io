export async function onRequest(context) {
  const response = await context.next();
  
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  // 1. 获取当前请求的 URL 路径
  const url = new URL(context.request.url);
  const path = url.pathname; // 例如：/zrsetu/706 或 /setu/123 或 /acg/456

  // 2. 根据路径匹配对应的 R2 目录后缀
  let r2Dir = "zrsetu_pic"; // 默认兜底
  if (path.startsWith("/setu")) {
    r2Dir = "setu_pic";
  } else if (path.startsWith("/acg")) {
    r2Dir = "acg_pic";
  } else if (path.startsWith("/zrsetu")) {
    r2Dir = "zrsetu_pic";
  }

  // 3. 构造注入的配置代码和脚本标签
  // 我们在 window 对象上挂载一个全局变量 __CF_R2_CONFIG__，供前端 JS 读取
  const injectConfigTag = `<script>window.__CF_R2_CONFIG__ = { r2Dir: "${r2Dir}" };</script>`;
  const injectScriptTag = `<script src="/js/r2-speedtest.js"></script>`;

  // 4. 将配置和脚本一起塞进 </body> 之前
  return new HTMLRewriter()
    .on("body", {
      element(element) {
        element.append(injectConfigTag, { html: true });
        element.append(injectScriptTag, { html: true });
      },
    })
    .transform(response);
}