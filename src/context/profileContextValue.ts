import { createContext } from 'react'

import type { ProfileContextValue } from '../types/app.js'

export const ProfileContext = createContext<ProfileContextValue | null>(null)
