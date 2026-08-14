<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# CRM H5 工作台

企业 CRM H5 工作台，包含角色化工作必备、可排序看板，以及关键事项的自动转入演示。

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## GitHub Pages 部署

仓库已包含 GitHub Actions 工作流。将代码推送到 `main` 后，在仓库的 **Settings → Pages** 将发布源设为 **GitHub Actions**；后续每次推送 `main` 都会自动构建并发布。工作流会根据仓库地址配置资源路径，支持项目页和个人主页。

## 发布约定

本项目的“发布”固定表示：先运行 `npm run lint`、`npm test` 与 `npm run build`，再提交并推送 `main` 至 GitHub，随后将 `dist/` 部署到 Cloudflare Pages 项目 `crm-workbench`。

Cloudflare Pages 手工发布命令：`npx wrangler pages deploy dist --project-name crm-workbench --branch main`。首次在新环境发布前需执行 `npx wrangler login` 完成 Cloudflare 授权。
