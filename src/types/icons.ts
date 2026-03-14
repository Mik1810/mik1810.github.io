import type { ReactElement } from 'react'

export type IconRenderer = (size?: number) => ReactElement

export type IconMap = Record<string, IconRenderer>
