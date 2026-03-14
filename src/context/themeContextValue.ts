import { createContext } from 'react'

import type { ThemeContextValue } from '../types/app.js'

export const ThemeContext = createContext<ThemeContextValue | null>(null)
