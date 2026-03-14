import { createContext } from 'react'

import type { AuthContextValue } from '../types/app.js'

export const AuthContext = createContext<AuthContextValue | null>(null)
