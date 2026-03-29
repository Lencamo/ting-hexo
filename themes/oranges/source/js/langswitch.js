// langswitch.js
(() => {
  const html = document.documentElement
  const switchButton = document.querySelector('#switch-language')
  const translations = window.__ORANGES_I18N__ || {}
  const languageOptions = window.__ORANGES_LANGUAGES__ || []
  const supportedLanguages = languageOptions.map(item => item.code)
  const defaultLanguage = window.__ORANGES_DEFAULT_LANGUAGE__ || supportedLanguages[0] || 'en'
  const storageKey = 'ui-language-v2'

  const replaceBuiltinVars = value => {
    if (typeof value !== 'string') return ''
    return value.replace(/\{thisYear\}/g, String(new Date().getFullYear()))
  }

  const resolveValue = (map, lang) => {
    if (!map || typeof map !== 'object') return ''
    return map[lang] ?? map[defaultLanguage] ?? Object.values(map)[0] ?? ''
  }

  const parseMap = element => {
    if (element.__orangesL10n) {
      return element.__orangesL10n
    }

    try {
      element.__orangesL10n = JSON.parse(element.getAttribute('data-l10n') || '{}')
    } catch (error) {
      element.__orangesL10n = {}
    }

    return element.__orangesL10n
  }

  const setElementValue = (element, value, attr) => {
    const nextValue = replaceBuiltinVars(value)

    if (attr === 'html') {
      element.innerHTML = nextValue
      return
    }

    if (attr && attr !== 'text') {
      element.setAttribute(attr, nextValue)
      return
    }

    element.textContent = nextValue
  }

  const applyTranslations = lang => {
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
      const key = element.getAttribute('data-i18n-key')
      const attr = element.getAttribute('data-i18n-attr') || 'text'
      const value = resolveValue(translations[key], lang)
      setElementValue(element, value, attr)
    })

    document.querySelectorAll('[data-l10n]').forEach(element => {
      const attr = element.getAttribute('data-l10n-attr') || 'text'
      const value = resolveValue(parseMap(element), lang)
      setElementValue(element, value, attr)
    })
  }

  const getNextLanguage = lang => {
    const currentIndex = supportedLanguages.indexOf(lang)

    if (currentIndex === -1 || supportedLanguages.length <= 1) {
      return defaultLanguage
    }

    return supportedLanguages[(currentIndex + 1) % supportedLanguages.length]
  }

  const getSwitchLabel = lang => {
    if (lang === 'zh-CN') return '切换到中文'
    if (lang === 'en') return 'Switch to English'
    return `Switch language: ${lang}`
  }

  const updateLanguageButton = lang => {
    if (!switchButton) return

    const nextLanguage = getNextLanguage(lang)
    const label = getSwitchLabel(nextLanguage)

    switchButton.setAttribute('title', label)
    switchButton.setAttribute('aria-label', label)
    switchButton.setAttribute('data-next-lang', nextLanguage)
  }

  const applyLanguage = lang => {
    const nextLanguage = supportedLanguages.includes(lang) ? lang : defaultLanguage

    html.setAttribute('ui-lang', nextLanguage)
    html.lang = nextLanguage
    localStorage.setItem(storageKey, nextLanguage)

    applyTranslations(nextLanguage)
    updateLanguageButton(nextLanguage)

    document.dispatchEvent(new CustomEvent('oranges:languagechange', {
      detail: { lang: nextLanguage }
    }))
  }

  if (switchButton) {
    switchButton.addEventListener('click', event => {
      event.preventDefault()
      const currentLanguage = html.getAttribute('ui-lang') || defaultLanguage
      applyLanguage(getNextLanguage(currentLanguage))
    }, false)
  }

  const initialLanguage = localStorage.getItem(storageKey) || html.getAttribute('ui-lang') || defaultLanguage
  applyLanguage(initialLanguage)
})()
