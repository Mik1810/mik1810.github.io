import { createContext } from 'react'

import type { LanguageContextValue } from '../types/app.js'

export const LanguageContext = createContext<LanguageContextValue | null>(null)
