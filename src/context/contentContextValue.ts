import { createContext } from 'react'

import type { ContentContextValue } from '../types/app.js'

export const ContentContext = createContext<ContentContextValue | null>(null)
