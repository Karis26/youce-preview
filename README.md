# youce-preview

油册｜润滑油公开参数参考站（预览）

本仓库收录已审阅的静态网站原件，供 GitHub Pages 公开预览。页面、数值、出处、核对状态、非官方预览说明、`noindex` 与 `robots.txt` 均保持导入时的原文，发布流程不改写这些内容。

这是独立的非官方预览。它不代表美孚或任何润滑油品牌，也不表示获得授权、认证或经销关系。

## 站点布局

静态文件放在仓库根目录。默认分支选择根目录发布时，项目站点的路径前缀是 `/youce-preview/`，现有相对链接按这个前缀工作。

- 页面：`index.html`、`catalog.html`、`compare.html`、`method.html`、`about.html`、`oils.html`、`rules.html`，以及 `oils/` 中的产品页
- 数据与脚本：`data.js`（`window.OILS`）、`app.js`、`styles.css`
- `robots.txt` 为 `Disallow: /`
- 每个 HTML 页面都有 `<meta name="robots" content="noindex,nofollow">`
- 根页面的 `data-root` 为 `./`，产品页为 `../`
- `.nojekyll` 关闭 Jekyll，避免发布时改写或漏掉原文件

## 启用 GitHub Pages

仓库当前是公开仓库，Pages 尚未启用。请在本发布 PR 合并进 `main` 之后再打开 Pages。若提前对默认分支启用，发布出来的会是只有本说明的 `main`，而不是油册。

在 GitHub 网页中设置：

1. 打开本仓库的 Settings → Pages。
2. Build and deployment 的 Source 选择 **Deploy from a branch**。
3. Branch 选择 **main**，Folder 选择 **/ (root)**。
4. 保存。

这里没有另加 GitHub Actions 部署工作流。Actions 部署要求 Pages 来源改成 GitHub Actions，和上面的默认分支根目录发布是两套来源，同时启用会冲突。

本代理可以读取仓库状态，但没有 Pages 写入接口，因此没有修改 Pages 设置。合并前 `GET /repos/Karis26/youce-preview/pages` 返回 404，`has_pages` 为 false。

## 合并并保存设置后的核对

仓库地址不是网站。Pages 设置页保存后会给出站点地址；在对该地址做 HTTP 检查并看到油册正文之前，不要把它当作已发布。

按设置页给出的地址核对（项目站点路径前缀应为 `/youce-preview/`）：

- `/` 与 `/index.html` 返回油册首页，标题为「油册 · 润滑油参数志」，页内有「独立非官方预览。」
- `/catalog.html`、`/compare.html`、`/method.html` 返回对应页面
- `/oils/mobil-1-classic-0w-20-pds-cn.html` 返回该产品页，并带有「已对照原文」
- `/data.js` 中 `window.OILS` 的数组长度为 469
- `/robots.txt` 正文为 `User-agent: *` 与 `Disallow: /`
- 抽查的 HTML 响应仍包含 `noindex,nofollow`
- 首页上的油品库、对照、数据方法、关于，以及示例产品链接，在 `/youce-preview/` 下均可打开
- 油品库默认「只看中国市场」时，页面计数与 `data.js` 里 `chinaDefault === true` 的 378 条一致

只有以上响应都符合，才算公开预览已经发布。
