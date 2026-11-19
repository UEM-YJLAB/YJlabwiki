<script setup lang="ts">
/**
 * 开门页 —— 整站唯一入口，答对「实验室里出现次数最多的人名」才放行。
 *
 * 逻辑都在 ./gate.ts，这里只管界面和倒计时。
 * 没通过时 Layout 会渲染它，并靠 <html data-yjlab-gate="locked"> 把正文藏起来
 * （那个属性由 config.mts head 里的内联脚本在页面绘制前设置，避免内容闪一下）。
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import {
  LOCK_MS,
  MAX_FAILS,
  QUESTION,
  answerIsCorrect,
  clearFails,
  cryptoAvailable,
  lockRemainingMs,
  registerFail,
  rememberPass,
} from './gate'

const emit = defineEmits<{ unlocked: [] }>()

const value = ref('')
const message = ref('')
const busy = ref(false)
/** 剩余锁定毫秒数；> 0 时输入框禁用 */
const lockedFor = ref(0)
/** Web Crypto 不可用（http 非 localhost）时的提示 */
const unsupported = ref(false)

const inputEl = useTemplateRef<HTMLInputElement>('input')

let ticker: ReturnType<typeof setInterval> | undefined

function mmss(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const lockedLabel = computed(() => mmss(lockedFor.value))

function startTicker() {
  stopTicker()
  ticker = setInterval(() => {
    lockedFor.value = lockRemainingMs()
    if (lockedFor.value <= 0) {
      stopTicker()
      lockedFor.value = 0
      message.value = `可以再试了，还有 ${MAX_FAILS} 次机会。`
      inputEl.value?.focus()
    }
  }, 500)
}

function stopTicker() {
  if (ticker !== undefined) {
    clearInterval(ticker)
    ticker = undefined
  }
}

async function submit() {
  if (busy.value || lockedFor.value > 0 || !cryptoAvailable()) return

  const raw = value.value
  if (!raw.trim()) {
    message.value = '先写下答案再提交。'
    return
  }

  busy.value = true
  try {
    if (await answerIsCorrect(raw)) {
      rememberPass()
      clearFails()
      message.value = ''
      emit('unlocked')
      return
    }

    value.value = ''
    const { fails, lockMs } = registerFail()
    if (lockMs > 0) {
      // 锁定的文案不写在这里，交给下面的「锁定中」分支按状态渲染（会自己倒计时）
      lockedFor.value = lockMs
      message.value = ''
      startTicker()
    } else {
      message.value = `答案不对，再错 ${MAX_FAILS - fails} 次就要锁 ${mmss(LOCK_MS)}。`
    }
  } catch {
    message.value = '这个浏览器算不了哈希（需要 https 或 localhost），请换个浏览器。'
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  unsupported.value = !cryptoAvailable()
  lockedFor.value = lockRemainingMs()
  if (lockedFor.value > 0) {
    value.value = ''
    startTicker()
  }
  inputEl.value?.focus()
})

onBeforeUnmount(stopTicker)
</script>

<template>
  <div class="auth-gate">
    <div class="auth-gate__card">
      <div class="auth-gate__logo">
        <span class="auth-gate__logo-red">YJ</span>lab
        <span class="auth-gate__tagline">实验室维基</span>
      </div>

      <h1 class="auth-gate__question">{{ QUESTION }}</h1>
      <p class="auth-gate__hint">写中文姓名即可。答对后本会话有效，关掉浏览器要重新答。</p>

      <form class="auth-gate__form" @submit.prevent="submit">
        <label class="auth-gate__label" for="yjlab-gate-answer">答案</label>
        <div class="auth-gate__row">
          <input
            id="yjlab-gate-answer"
            ref="input"
            v-model="value"
            class="auth-gate__input"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            :disabled="busy || lockedFor > 0"
            :placeholder="lockedFor > 0 ? `锁定中 ${lockedLabel}` : '输入姓名'"
          >
          <button
            class="auth-gate__btn"
            type="submit"
            :disabled="busy || lockedFor > 0"
          >{{ lockedFor > 0 ? lockedLabel : busy ? '校验中…' : '进入' }}</button>
        </div>
      </form>

      <p
        v-if="unsupported"
        class="auth-gate__msg auth-gate__msg--err"
        role="alert"
      >
        当前浏览器不支持 Web Crypto（需要 https 或 localhost），无法校验答案。
      </p>
      <!-- 锁定状态按状态渲染，不再拼字符串：倒计时自己会走 -->
      <p
        v-else-if="lockedFor > 0"
        class="auth-gate__msg auth-gate__msg--err"
        role="alert"
      >
        答案连错 {{ MAX_FAILS }} 次。锁定中，请 <strong>{{ lockedLabel }}</strong> 后再试。
      </p>
      <p
        v-else-if="message"
        class="auth-gate__msg"
        :class="{ 'auth-gate__msg--err': message.startsWith('答案不对') }"
        role="alert"
      >{{ message }}</p>

      <noscript>
        <p class="auth-gate__msg auth-gate__msg--err">
          本站的打开方式需要 JavaScript，请开启后刷新。
        </p>
      </noscript>

      <p class="auth-gate__foot">
        实验室内部资料，<strong>不是</strong>保险箱：正文本身在静态页面里，这道门只是让顺手点开的人
        先答个题。请勿往站内写保密内容。
      </p>
    </div>
  </div>
</template>
