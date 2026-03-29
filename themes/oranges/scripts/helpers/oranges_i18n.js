'use strict';

const DEFAULT_LANGUAGE_OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'zh-CN', label: '中' }
];

function toSafeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeLanguageOptions(themeConfig = {}, siteConfig = {}) {
  const configured = themeConfig.languageSwitch && Array.isArray(themeConfig.languageSwitch.languages)
    ? themeConfig.languageSwitch.languages
    : [];

  const options = configured
    .map(item => {
      if (typeof item === 'string') {
        return { code: item, label: item.toUpperCase() };
      }

      if (item && item.code) {
        return { code: item.code, label: item.label || item.code.toUpperCase() };
      }

      return null;
    })
    .filter(Boolean);

  if (options.length) {
    return [...new Map(options.map(item => [item.code, item])).values()];
  }

  const siteLanguages = Array.isArray(siteConfig.language)
    ? siteConfig.language
    : [siteConfig.language].filter(Boolean);

  if (siteLanguages.length) {
    return siteLanguages.map(code => ({
      code,
      label: code === 'zh-CN' ? '中' : code.toUpperCase()
    }));
  }

  return DEFAULT_LANGUAGE_OPTIONS;
}

function getDefaultLanguage(themeConfig = {}, siteConfig = {}) {
  const options = normalizeLanguageOptions(themeConfig, siteConfig);
  const preferred = themeConfig.languageSwitch && themeConfig.languageSwitch.default;

  if (preferred && options.some(item => item.code === preferred)) {
    return preferred;
  }

  return options[0].code;
}

function normalizeLocalizedValue(value, languages, fallbackLanguage) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const hasLanguageKey = languages.some(lang => Object.prototype.hasOwnProperty.call(value, lang));

    if (hasLanguageKey) {
      return languages.reduce((result, lang) => {
        const nextValue = value[lang] ?? value[fallbackLanguage] ?? value.default ?? '';
        result[lang] = nextValue == null ? '' : String(nextValue);
        return result;
      }, {});
    }
  }

  const text = value == null ? '' : String(value);

  return languages.reduce((result, lang) => {
    result[lang] = text;
    return result;
  }, {});
}

function translate(key, lang) {
  return hexo.theme.i18n.__([lang, 'default'])(key);
}

hexo.extend.helper.register('oranges_language_options', function() {
  return normalizeLanguageOptions(this.theme, this.config);
});

hexo.extend.helper.register('oranges_language_options_json', function() {
  return toSafeJson(normalizeLanguageOptions(this.theme, this.config));
});

hexo.extend.helper.register('oranges_default_language', function() {
  return getDefaultLanguage(this.theme, this.config);
});

hexo.extend.helper.register('oranges_translate', function(key, lang) {
  const nextLanguage = lang || getDefaultLanguage(this.theme, this.config);
  return translate(key, nextLanguage);
});

hexo.extend.helper.register('oranges_i18n_json', function(keys) {
  const options = normalizeLanguageOptions(this.theme, this.config);
  const languages = options.map(item => item.code);
  const result = {};

  keys.forEach(key => {
    result[key] = {};
    languages.forEach(lang => {
      result[key][lang] = translate(key, lang);
    });
  });

  return toSafeJson(result);
});

hexo.extend.helper.register('oranges_localize', function(value, lang) {
  const options = normalizeLanguageOptions(this.theme, this.config);
  const languages = options.map(item => item.code);
  const fallbackLanguage = getDefaultLanguage(this.theme, this.config);
  const map = normalizeLocalizedValue(value, languages, fallbackLanguage);

  return map[lang || fallbackLanguage] || '';
});

hexo.extend.helper.register('oranges_localize_json', function(value) {
  const options = normalizeLanguageOptions(this.theme, this.config);
  const languages = options.map(item => item.code);
  const fallbackLanguage = getDefaultLanguage(this.theme, this.config);
  const map = normalizeLocalizedValue(value, languages, fallbackLanguage);

  return toSafeJson(map);
});

hexo.extend.helper.register('oranges_localize_attr_json', function(value) {
  const options = normalizeLanguageOptions(this.theme, this.config);
  const languages = options.map(item => item.code);
  const fallbackLanguage = getDefaultLanguage(this.theme, this.config);
  const map = normalizeLocalizedValue(value, languages, fallbackLanguage);

  return escapeHtmlAttr(toSafeJson(map));
});
