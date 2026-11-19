# YJlab 维基

应急科技创新实验室的内部维基。外观复刻 Wikipedia Vector (2010) 皮肤，内容为 Markdown，
构建成纯静态站点，由 GitHub Pages 托管。

- **线上**：https://brobrush.github.io/YJlabwiki/
- **仓库**：https://github.com/brobrush/YJlabwiki

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物在 docs/.vitepress/dist/
```

> `npm install` 若报 esbuild 错误，执行 `npm install-scripts approve esbuild` 后重装。

## 想改内容

**不用看这个 README。** 站内的[编辑指南](https://brobrush.github.io/YJlabwiki/help/)写了怎么写、
有哪些语法、页面怎么命名、新增页面要改哪两处。最简单的方式：在页面上点右上角「编辑」，
直接在浏览器里改 Markdown，提交后约 1 分钟自动上线。

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
| 开门页（访问门槛）的问题与答案密文 | `docs/.vitepress/theme/auth/gate.ts`，见下文「访问门槛」 |

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
（⚠️ 那段脚本把 `'yjlab-wiki-theme'` 和 `'wiki'` 写死了，改 `STORAGE_KEY` / `DEFAULT_THEME` 时要同步）。

> **写主题 CSS 时注意**：VitePress 的 `<Content />` 会在正文外包一层 `<div>`，
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

**⚠️ XP 主题最容易踩的坑：base 前缀。** 这个站部署在 `/YJlabwiki/` 子路径下，
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
答对了才显示正文。本会话内有效（关掉浏览器要重新答）。连错 2 次锁 5 分钟。

代码只有四个文件：

| 文件 | 作用 |
| --- | --- |
| `theme/auth/gate.ts` | 问题、答案的 **SHA-256 密文**、sessionStorage 放行标记、错次/锁定计数 |
| `theme/auth/AuthGate.vue` | 那张门本身（输入框、回车提交、倒计时） |
| `theme/auth/auth-gate.css` | 门的样式，外加「锁着时藏正文 / 放行后不画门」两条规则 |
| `Layout.vue` + `config.mts` | 门挂在 Layout 上；`config.mts` 的 `head` 里那段内联脚本在**页面绘制前**判断放行状态 |

存储键：`yjlab-gate-pass`（sessionStorage，值就是密文本身）、
`yjlab-gate-fail`（localStorage，存错次和锁定到期时间）。

### 答案放在哪、怎么改

**仓库里只有密文。** `gate.ts` 里的 `DIGEST` 是答案的 SHA-256，答案明文不进代码、
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

### ⚠️ 它只是门帘，不是鉴权

- 站点是预渲染的静态站，**每页正文本来就在 `dist/*.html` 里明文**，`curl` 一下、
  右键看源码、翻公开仓库的 `.md`、或者读 `docs/public/search-index.json`
  都能绕过这道门。它治的是「随手点进来的人」。
- 答案空间是实验室名单（几十个词），SHA-256 可被毫秒级字典爆破。这里没有
  再叠 PBKDF2 迭代 —— 挡不住，只会让每次输入变慢、并让人误以为它安全。
- 真要保密，只有三条路：仓库转私有、加后端登录、或用 Cloudflare Access 之类
  有服务端的方案。
- `404.html` 不走 `Layout`，所以「页面不存在」那页没有门（里面也没有正经内容）。

另外注意：Web Crypto 只在 **https 或 localhost** 下可用，所以本地用 `npm run dev`
（或 `127.0.0.1`）测试；用 `http://192.168.x.x` 打开会提示「这个浏览器算不了哈希」。

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
   也**不要**用 `v-if="locked"` 把 `<Content />` 摘掉：XP 主题每个窗口是 fetch 那一页的
   静态 HTML 再抠 `.wiki-body` 的，正文不在 HTML 里 XP 就全空了。


## 部署

GitHub Pages 自动部署，配置在 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)：
push 到 `main` 即触发，约 1 分钟上线。进度看仓库的 Actions 页。

⚠️ 项目站点跑在子路径 `/YJlabwiki/` 下，所以 workflow 里设了 `BASE_PATH=/YJlabwiki/`。
**将来绑定独立域名时要把这一行删掉**，否则所有链接都会指向错误路径。

两个本地调试的坑：

- `npm run preview` 启动时会缓存文件清单，重新 `build` 后必须重启它，否则页面是无样式的裸 HTML。
  日常用 `npm run dev`。
- `python3 scripts/serve-404-test.py` 模拟真实托管平台的 cleanUrls 与 404 行为
  （`vitepress preview` 在这两点上不准，会让你误判站点有问题）。

## 交接

- 用**实验室公共账号**管仓库，不要挂在个人账号上
- 仓库至少留 2 个管理员，凭据存进组内共享的密码库
- 站点内容**对全网公开** —— GitHub Pages 免费版无法加登录，不要往里写隐私与保密材料。
  现在有一道进门答题的门（见上文「访问门槛」），但那只是让顺手点开的人答个题，
  **不是鉴权**，别把它当保险箱。
