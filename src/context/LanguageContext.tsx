import { useCallback, useEffect, useMemo, useState } from 'react'

import staticI18n from '../data/staticI18n.json'
import type { ProviderProps, SupportedLocale, TranslationNode } from '../types/app.js'
import { LanguageContext } from './languageContextValue'

type TranslationTree = Record<string, TranslationNode>

const translationsByLocale = staticI18n as Record<SupportedLocale, TranslationTree>

export function LanguageProvider({ children }: ProviderProps) {
  const [lang, setLang] = useState<SupportedLocale>(() => {
    const savedLang = localStorage.getItem('lang')
    return savedLang === 'en' ? 'en' : 'it'
  })

  useEffect(() => {
    localStorage.setItem('lang', lang)
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const translations = useMemo<TranslationTree>(
    () => translationsByLocale[lang] || translationsByLocale.it,
    [lang]
  )
  const loading = false

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'it' ? 'en' : 'it'))
  }, [])

  const t = useCallback(
    (key: string) => {
      const keys = key.split('.')
      let value: TranslationNode | undefined = translations
      for (const currentKey of keys) {
        if (typeof value !== 'object' || value === null) {
          return key
        }
        value = value[currentKey]
      }
      return typeof value === 'string' ? value : key
    },
    [translations]
  )

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, loading }}>
      {children}
    </LanguageContext.Provider>
  )
}
