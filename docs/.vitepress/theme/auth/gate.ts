/* ============================================================================
 *  访问门槛 —— 纯前端的「门帘」
 *
 *  开门问题：「实验室里出现次数最多的人名是谁？」用户输入中文姓名，
 *  这里把它归一化后算 SHA-256，与 DIGEST 对比，一致才放行。
 *
 *  ⚠️ 为什么仓库里只有密文：这个文件的每次改动都进 git 历史。答案本身
 *     永远不要写进代码、注释、README、commit message、分支名。
 *     要改答案，按 README「访问门槛」一节重新生成 DIGEST 即可。
 *
 *  ⚠️ 这不是安全边界，只是个减速带：
 *     站点是 VitePress 预渲染的静态站，每页正文本来就在 dist/*.html 里明文；
 *     任何人 `curl` 一下、或右键看源码、或读公开仓库的 .md 都能绕过这道门。
 *     它的作用仅仅是「随手点进来的人看不到东西」+「答不出就进不去」的社交门槛。
 *     真要保密，得把仓库转私有，或者上 Cloudflare Access 之类有服务端的方案。
 *
 *  ⚠️ 纯前端能做的极限就是给爆破加成本：答案空间是实验室名单（几十个词），
 *     SHA-256 字典爆破是毫秒级的。这里没有再叠 PBKDF2 迭代，因为挡不住，
 *     只会让每次输入变慢、并且让人误以为它安全。
 * ==========================================================================*/

/** 开门问题。改它不影响答案。 */
export const QUESTION = '实验室里出现次数最多的人名是谁？'

/**
 * 答案的 SHA-256（十六进制）。仓库里只有这个密文。
 *
 * 重新生成的命令（把 答案换成真实姓名，别在仓库目录里执行、别留下 shell 历史）：
 *   node -e "const c=require('crypto');
 *     console.log(c.createHash('sha256')
 *       .update(process.argv[1].normalize('NFKC').trim())
 *       .digest('hex'))" 答案
 */
export const DIGEST = 'e8c5238a3ecba29181b4ad48985e670a254cfdc8bd83b645664bfea25a697840'

/** 放行状态存这里。用 sessionStorage：关掉浏览器就失效，重开要重新答。 */
export const SESSION_KEY = 'yjlab-gate-pass'

/** 错误次数 / 锁定期存这里。用 localStorage：关浏览器再开也接着锁。 */
export const FAIL_KEY = 'yjlab-gate-fail'

/** 写在 <html> 上的属性名：'locked' 锁着、'open' 已放行（由 head 内联脚本预绘制设置） */
export const GATE_ATTR = 'data-yjlab-gate'

/** 错几次开始锁 */
export const MAX_FAILS = 2

/** 锁多久 */
export const LOCK_MS = 5 * 60 * 1000

/* ------------------------------------------------------------------ 校验 */

/**
 * 归一化：NFKC（全角字符转半角等）+ 去掉首尾空白。
 *
 * 汉字原样保留 —— 要的是「精确的汉字」，不认拼音、不认中间加空格。
 * 只抹掉看不见的首尾空格，避免复制粘贴时因为尾随空格被判错。
 */
export function normalizeAnswer(input: string): string {
  return input.normalize('NFKC').trim()
}

/** 浏览器的 Web Crypto 是否可用（http 非 localhost 下没有） */
export function cryptoAvailable(): boolean {
  return typeof globalThis.crypto?.subtle?.digest === 'function'
}

/** UTF-8 文本的 SHA-256，十六进制小写 */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await globalThis.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** 用户输入是否正确 */
export async function answerIsCorrect(input: string): Promise<boolean> {
  const text = normalizeAnswer(input)
  if (!text) return false
  return (await sha256Hex(text)) === DIGEST
}

/* ------------------------------------------------------------ 会话放行状态 */

export function hasPass(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === DIGEST
  } catch {
    return false
  }
}

export function rememberPass(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, DIGEST)
  } catch {
    /* 隐私模式 / 禁用存储时忽略：那就每次刷新都得重答 */
  }
}

export function forgetPass(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* 同上 */
  }
}

/* ------------------------------------------------------------ 错误次数与锁定 */

interface FailState {
  /** 连续答错次数（未锁定期间累计） */
  fails: number
  /** 锁定到期时间戳；0 表示没锁 */
  until: number
}

function readFail(): FailState {
  try {
    const raw = localStorage.getItem(FAIL_KEY)
    if (!raw) return { fails: 0, until: 0 }
    const parsed = JSON.parse(raw) as Partial<FailState>
    const fails = Number.isFinite(parsed?.fails) ? Number(parsed!.fails) : 0
    const until = Number.isFinite(parsed?.until) ? Number(parsed!.until) : 0
    // 锁定已过期：次数清零
    if (until && until <= Date.now()) return { fails: 0, until: 0 }
    return { fails: Math.max(0, fails), until: Math.max(0, until) }
  } catch {
    return { fails: 0, until: 0 }
  }
}

function writeFail(state: FailState): void {
  try {
    if (!state.fails && !state.until) localStorage.removeItem(FAIL_KEY)
    else localStorage.setItem(FAIL_KEY, JSON.stringify(state))
  } catch {
    /* 存不了就退化成「只在本次页面内计数」，不影响使用 */
  }
}

/** 还剩多少毫秒的锁 */
export function lockRemainingMs(): number {
  const { until } = readFail()
  return until > 0 ? Math.max(0, until - Date.now()) : 0
}

/**
 * 记一次答错。返回记完之后的状况，供界面提示用。
 *
 * 连续错 MAX_FAILS 次 → 锁 LOCK_MS，并把次数清零（解锁后重新从 0 数）。
 */
export function registerFail(): { fails: number; lockMs: number } {
  const state = readFail()
  if (state.until > 0) return { fails: state.fails, lockMs: state.until - Date.now() }

  const fails = state.fails + 1
  if (fails >= MAX_FAILS) {
    writeFail({ fails: 0, until: Date.now() + LOCK_MS })
    return { fails: 0, lockMs: LOCK_MS }
  }
  writeFail({ fails, until: 0 })
  return { fails, lockMs: 0 }
}

/** 答对了：清掉错误计数 */
export function clearFails(): void {
  writeFail({ fails: 0, until: 0 })
}
