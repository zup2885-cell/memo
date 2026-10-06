# Memo

天空与麦田主题的备忘录、日历和提醒效果原型，使用 HTML、CSS 和原生 JavaScript。

[在线体验](https://zup2885-cell.github.io/memo/) · [下载完整项目](https://github.com/zup2885-cell/memo/archive/refs/heads/main.zip)

## 使用

- **在线体验：** 打开上方链接即可使用，无需安装或注册。
- **本机打开：** 下载项目，解压后用浏览器打开根目录的 `index.html`。页面、图片、内置声音和图标均包含在项目中。
- **本机服务器：** 在项目目录运行 `python3 -m http.server 8080`，然后打开 `http://localhost:8080`。

便签和事件保存在当前浏览器的本机存储中，不会上传到 GitHub，也不会在设备间同步。清除浏览器站点数据会清除记录。自选图片、动图、视频和音频仅保留于当前页面会话，刷新后需重新添加。

## 功能

- 文字便签与待办清单；自动暂存、编辑、搜索、标签、颜色、置顶及删除撤销。
- 周一为起点的月历；直接选择年、月、日（1900–2100 年），支持跨年与闰年。
- 单日事件，支持全天、开始与结束时间、备注，以及自定义提醒时间。
- 全屏提醒效果预览、查看事件、10 分钟后提醒及关闭。
- 自选铃声或音乐；提醒图标可使用内置图案、图片、GIF 或视频。
- 更换图片、动图或视频后，界面配色和打开动画随画面的主色、明暗变化。
- 手机布局、键盘操作和减少动态效果模式。

**这是网页版交互原型。** 点击「预览提醒」演示提醒效果。当前不会按时间自动通知，也不能在关闭页面后运行。Mac 菜单栏、后台运行、「模拟登录」和「登录时自动启动」均为界面演示，不会修改电脑设置；此版本不包含 Mac 安装程序。

日期按 `Asia/Shanghai` 处理。

## 开发

需要 Python 3。构建无需额外 Python 库或在线下载。

```sh
python3 build.py
```

生成根目录 `index.html` 和 `dist/memo-web.zip`。图标库已随项目打包。

```sh
node prototype/theme.test.cjs
node prototype/reminders.test.cjs
node --check prototype/memo.js
```

`prototype/` 保存界面模板、样式与脚本，`web/` 保存独立浏览器外壳和本机存储适配。修改后重新运行构建命令。

若需生成对话中的界面片段，可运行 `python3 prototype/build.py`；也可通过 `--inline-dir` 指定额外输出目录。

## GitHub Pages

在仓库的 **Settings → Pages** 中，选择 **Deploy from a branch**，使用 `main` 分支的 `/(root)` 目录。根目录的 `.nojekyll` 让 GitHub 直接发布静态页面。

[GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 许可

源代码采用 [MIT 许可证](LICENSE)。内置示例照片不属于代码许可范围。

图标使用 [Lucide 0.468.0](https://lucide.dev)，其许可证见 [vendor/LICENSE-lucide](vendor/LICENSE-lucide)。
