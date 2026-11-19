# YJlab 维基

应急科技创新实验室维护的公开维基，仓库归属 **UEM-YJLAB 组织**。
外观复刻 Wikipedia Vector (2010) 皮肤，内容为 Markdown，构建成纯静态站点，由 GitHub Pages 托管。

- **线上**：https://uem-yjlab.github.io/YJlabwiki/
- **仓库**：https://github.com/UEM-YJLAB/YJlabwiki

## 快速开始

使用 Node.js 24（版本约定见 `.node-version`）和随附的 npm。

```bash
git clone https://github.com/UEM-YJLAB/YJlabwiki.git
cd YJlabwiki
npm ci
npm run dev      # http://localhost:5173
npm run build    # 产物在 docs/.vitepress/dist/
```

依赖由 `package-lock.json` 固定，首次安装和 CI 都使用 `npm ci`。
如果本地副本仍指向个人仓库，先执行
`git remote set-url origin https://github.com/UEM-YJLAB/YJlabwiki.git`，再 `git fetch origin`。

### 依赖维护记录（2026-11-19）

当前 npm 稳定版为 VitePress 1.6.4，2.x 仍为预发布版本，因此本站保留稳定版。
`npm audit` 仍报告 Vite / esbuild 依赖链的 3 项开发依赖告警（1 项 high、2 项 moderate），
当前稳定版没有兼容的自动修复。后续升级需验证自定义主题、答题入口和子路径路由。
告警涉及开发服务器等工具，GitHub Pages 只发布构建出的静态文件。详情见
[Vite 公告](https://github.com/advisories/GHSA-4w7w-66w2-5vf9)与
[esbuild 公告](https://github.com/advisories/GHSA-67mh-4wv8-2f99)。

## 想改内容

**不用看这个 README。** 站内的[编辑指南](https://uem-yjlab.github.io/YJlabwiki/help/)写了怎么写、
有哪些语法、页面怎么命名、新增页面要改哪两处。最简单的方式：在页面上点右上角「编辑」，
直接在浏览器里改 Markdown，改动进入 `main` 后自动构建上线。

## 想改站点本身

| 想改什么 | 改哪里 |
| --- | --- |
| 侧栏分类与条目 | `docs/.vitepress/config.mts` 的 `SIDEBAR` |
| 仓库地址（「编辑」「查看历史」标签指向） | 同文件顶部的 `REPO` |
| 站点名、描述 | 同文件的 `defineConfig` |
| 配色、字体、排版 | `docs/.vitepress/theme/wiki.css` |
| 布局（侧栏 / 标签页 / 页脚） | `docs/.vitepress/theme/Layout.vue` |
| 404 页 | `docs/.vitepress/theme/NotFound.vue` |
| 侧栏搜索 | `docs/.vitepress/theme/WikiSearch.vue` |
| 主题（皮肤） | `docs/.vitepress/theme/themes.ts` 注册，每个主题一个 css |
| 开门页（访问门槛）的问题与答案摘要 | `docs/.vitepress/theme/auth/gate.ts`，见下文「访问门槛」 |

`docs/` 下按栏目分目录：`chronicle/` 世代编年史、`groups/` 组别、`tools/` 工具介绍、
`help/` 帮助；`public/` 放图片与 favicon；`scripts/` 是构建与调试脚本。

### 主题（皮肤）

默认是维基百科风，侧栏「**外观**」里可以切换。加一个新主题只要三步：

1. 在 `docs/.vitepress/theme/` 下新建 `<id>.css`，**所有规则都用
   `html[data-wiki-theme='<id>']` 打头** —— 这样各主题互不污染，也不会动到默认皮肤
2. 在 `themes.ts` 的 `THEMES` 数组里加一项
3. 在 `theme/index.ts` 里 `import './<id>.css'`

侧栏的选择器是遍历 `THEMES` 渲染的，不用改。选择存在 `localStorage`；
`config.mts` 的 `head` 里有一段内联脚本在页面绘制前套用主题，避免刷新时闪一下
（那段脚本把 `'yjlab-wiki-theme'` 和 `'wiki'` 写死了，改 `STORAGE_KEY` / `DEFAULT_THEME` 时要同步）。

> **主题 CSS 的坑**：VitePress 的 `<Content />` 会在正文外包一层 `<div>`，
> 所以标题必须用 `h1:first-of-type` 而不是 `> h1:first-child` —— 后者永远匹配不到，
> 标题会退化成黑字无下划线，在深色主题下直接看不见（踩过这个坑）。

主题用到的图片放 `docs/.vitepress/theme/legend/`，**在 CSS 里用相对路径引用**
（`url('./legend/xxx.png')`）—— Vite 会自动处理成带 base 前缀的资源，部署到
`/YJlabwiki/` 这种子路径下也不会 404；写成绝对路径 `/legend/xxx.png` 就会 404。

素材来源与授权：

| 文件 | 来源 | 授权 |
| --- | --- | --- |
| `legend/wings-gold.png`、`wings-red.png` | [Angel Wings Effect](https://opengameart.org/content/angel-wings-effect) by Cethiel，本仓库把 5 帧原图合成为 APNG 并居中补齐 | **CC0**（公有领域） |
| `legend/burst.svg`、`sparkle.svg` | 本仓库自绘 | 同本站 |

### WindowsXP 主题（会替换整站结构）

它是唯一一个**不只是配色**的主题：切过去之后整站变成一台模拟电脑 ——
桌面图标、可拖拽/缩放/最小化/最大化的窗口、任务栏、开始菜单，还有一个能玩的俄罗斯方块。
代码在 `docs/.vitepress/theme/winxp/`：

| 文件 | 作用 |
| --- | --- |
| `windows.ts` | 窗口管理器：开/关/拖动/缩放/最小化/最大化/置顶 |
| `XpWindow.vue` | XP Luna 标题栏与八个方向的窗口操作 |
| `XpDesktop.vue` | 桌面、图标、窗口层，以及和路由的同步 |
| `XpTaskbar.vue` · `XpStartMenu.vue` | 任务栏与开始菜单（原侧栏内容和主题切换都搬到这里） |
| `XpMyComputer.vue` | 「我的电脑」：各个栏目与条目，外加一个假文件 |
| `XpTetris.vue` | 可以玩的俄罗斯方块 |
| `theme-winxp.css` | Luna 配色、CSS 合成的「Bliss」墙纸 |

**页面正文是怎么来的：** 不用 VitePress 的 `<Content />`（它只渲染**当前路由**，
一个窗口都嫌多），而是每个窗口各自 `fetch` 那一页已经预渲染好的 HTML，
把 `.wiki-body` 抓出来塞进窗口 —— 见 `winxp/xpPages.ts`。
所以**每个页面一个窗口，可以同时开任意多个**，互不干扰。
代价是抓来的是静态快照，里面的 Vue 交互组件不活；网页里的链接由
`XpDesktop.vue` 的事件委托接管，所以点击跳转照常能用。

**XP 主题最容易踩的坑：base 前缀。** 这个站部署在 `/YJlabwiki/` 子路径下，
而 VitePress 内部是**按长度剥 base** 的：

```js
pagePath = sanitizeFileName(pagePath.slice(base.length).replace(/\//g, '_')) + '.md'
```

所以 `router.go()` 必须传 `withBase(path)` 的**带前缀**地址 —— 传 `/chronicle/gen-1`
会被 `slice(11)` 切成 `ronicle/gen-1`，然后整站显示「页面不存在」。
另外 `useRoute().path` **本身就已经带 base**，拿它当应用路径用之前必须先
`stripBase()` 剥掉，否则会拼成 `/YJlabwiki/YJlabwiki/...` 而 404，
而且窗口 id 会一个带 base 一个不带，同一个页面开出两个窗口。

这一类 bug 本地开发时**测不出来**（本地 base 是 `/`，`withBase` 是空操作），
必须用子路径构建来验证：

```bash
BASE_PATH=/YJlabwiki/ npm run build
SERVE_BASE=/YJlabwiki python3 scripts/serve-404-test.py 4231
XP_BASE=/YJlabwiki/ python3 scripts/xp-shot.py <路由> <输出名> [要执行的JS]
```

`scripts/xp-shot.py` 会注入主题种子和一张慢加载图（把 `load` 拖后，好让无头浏览器
拍到客户端渲染结果），也可以注入 JS 模拟点击；`XP_DELAY` 控制慢图延时。
跑完记得 `npm run build` 把注入清掉（dist 本来就在 `.gitignore` 里）。

## 访问门槛（进门先答题）

打开任何页面先看到一张门：「实验室里出现次数最多的人名是谁？」，写中文姓名，
答对了才显示正文。放行状态保存在当前标签页的 sessionStorage 中。连错 2 次锁 5 分钟。

相关文件：

| 文件 | 作用 |
| --- | --- |
| `theme/auth/gate.ts` | 问题、答案的 **SHA-256 摘要**、sessionStorage 放行标记、错次/锁定计数 |
| `theme/auth/AuthGate.vue` | 那张门本身（输入框、回车提交、倒计时） |
| `theme/auth/auth-gate.css` | 门的样式，外加「锁着时藏正文 / 放行后不画门」两条规则 |
| `Layout.vue` + `config.mts` | 门挂在 Layout 上；`config.mts` 的 `head` 里那段内联脚本在**页面绘制前**判断放行状态 |

存储键：`yjlab-gate-pass`（sessionStorage，值就是摘要本身）、
`yjlab-gate-fail`（localStorage，存错次和锁定到期时间）。

### 答案放在哪、怎么改

**仓库里只保存答案摘要。** `gate.ts` 里的 `DIGEST` 是答案的 SHA-256，答案明文不进代码、
不进注释、不进 README、**不进 commit message 和分支名** —— 那些也都是 git 历史。

要换答案，按下面的命令重新算（把 `答案` 换成真实姓名）：

```bash
node -e "const c=require('crypto');
  console.log(c.createHash('sha256')
    .update(process.argv[1].normalize('NFKC').trim())
    .digest('hex'))" 答案
```

把输出填进 `gate.ts` 的 `DIGEST` 即可。校验时会先做 NFKC + 去首尾空白，
所以全角/半角、复制粘贴带尾随空格都不影响；**汉字必须精确**，不认拼音。

### 边界

站点是预渲染的静态站，正文本来就在 `dist/*.html` 和公开仓库的 `.md` 里
（`docs/public/search-index.json` 也是公开的），所以这道门是前端遮罩：
`curl`、右键看源码都能绕过。答案空间是实验室名单（几十个词），SHA-256 可被
毫秒级字典爆破，所以没有再叠 PBKDF2 迭代（挡不住，只会让每次输入变慢）。
`404.html` 不走 `Layout`，所以「页面不存在」那页没有门。

Web Crypto 只在 **https 或 localhost** 下可用：本地用 `npm run dev`（或
`127.0.0.1`）测试，`http://192.168.x.x` 打开会提示「这个浏览器算不了哈希」。

## 改代码前必读

四处**删了会静默出问题**的地方：

1. **`docs/.vitepress/theme/index.ts` 必须导出 `NotFound`。** VitePress 内部执行的是
   `createRouter(loadPageModule, Theme.NotFound)`；缺了它，访问不存在的地址会**整页空白且控制台不报错**。
2. **`docs/.vitepress/markdown-cjk.ts` 不能删。** CommonMark 规定 `**` 左边紧挨标点就不能闭合，
   中文写作里 `**注意：**请勿…` 会原样吐出星号。这个插件在解析前后做私用区字符加脱壳来修掉它。
3. **搜索索引在构建前生成。** `npm run build` 已包含 `npm run index`；如果只跑 `vitepress build`，站内搜索会没有数据。
4. **开门页的防闪现是三处联动的**：`config.mts` 的 `head` 内联脚本打上
   `<html data-yjlab-gate="locked|open">`，`auth-gate.css` 据它隐藏 `.wiki-shell`，
   `Layout.vue` 在答对后把属性改成 `open`。删掉内联脚本 → 每次都会先闪一下正文；
   删掉 CSS 那两条规则 → 门在，但正文在门底下可见。
   也**不能**用 `v-if="locked"` 把 `<Content />` 摘掉：XP 主题每个窗口是 fetch 那一页的
   静态 HTML 再抠 `.wiki-body` 的，正文不在 HTML 里 XP 就全空了。


## 部署

GitHub Pages 自动部署，配置在 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)：
提交到 `main` 后自动生成搜索索引、构建 VitePress 并发布。进度看
[Actions](https://github.com/UEM-YJLAB/YJlabwiki/actions)，通常数分钟内完成。

组织仓库的初次配置：

1. 打开 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**。
2. 在 **Actions → 部署到 GitHub Pages → Run workflow** 中选择 `main` 运行一次；后续提交自动触发。
3. 部署成功后访问 https://uem-yjlab.github.io/YJlabwiki/ ，检查页面、样式与编辑链接。

从 `main` 的 `/docs` 直接发布会走 Jekyll（那里是 Markdown 和 Vue 源码），生不出本站界面；
实际发布目录是 `docs/.vitepress/dist/`。

工作流从 `actions/configure-pages` 的 `base_path` 输出设置 `BASE_PATH`，自动适配
`/YJlabwiki/` 子路径或 Pages 自定义域名；本地模拟线上路径时使用 `BASE_PATH=/YJlabwiki/ npm run build`。

部署使用 GitHub 自动提供的 `GITHUB_TOKEN` 和 OIDC，无需个人访问令牌。
组织的 Actions 策略需要允许本工作流使用的官方 `actions/*` 操作。

### API 推送备用脚本

正常协作使用 `git push`。仅在 Git 传输不可用时使用 `scripts/push-via-api.py`：

- 默认目标是 `UEM-YJLAB/YJlabwiki`，可用 `--repo owner/repo` 或 `GH_REPO` 显式覆盖。
- 身份验证依次读取 `GH_TOKEN`、`GITHUB_TOKEN`，或已登录的 GitHub CLI（`gh auth login`）。
- 需要对组织仓库具有相应写权限；修改工作流时，凭据也需要相应的工作流写权限。
- 脚本不再读取个人电脑上的 `~/.gh-oauth.json`。

```bash
python3 scripts/push-via-api.py --diff-base <远端当前提交>
```

两个本地调试的坑：

- `npm run preview` 启动时会缓存文件清单，重新 `build` 后需要重启它，否则页面是无样式的裸 HTML。
  日常用 `npm run dev`。
- `python3 scripts/serve-404-test.py` 模拟真实托管平台的 cleanUrls 与 404 行为
  （`vitepress preview` 在这两点上不准，会让你误判站点有问题）。

## 交接

- 仓库由 **UEM-YJLAB 组织**持有，成员用各自的 GitHub 账号协作，不共用个人登录凭据。
- 组织管理员通过团队分配权限：内容编辑者使用 **Write**，日常维护者使用 **Maintain**；
  仓库权限与团队授权由 **Admin** 或组织所有者管理。建议保留至少两位可信管理员。
- 交接时更新组织成员、团队和仓库维护文档；恢复码、域名等共享维护资料存入组织批准的密码管理器。
- 本仓库和当前 Pages 站点**对全网公开**。
