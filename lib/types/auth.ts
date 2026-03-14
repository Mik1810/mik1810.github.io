export interface SessionUser {
  id: string
  email: string
}

export interface SessionPayload {
  sub: string
  email: string
  iat: number
  exp: number
}
