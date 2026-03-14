export type ApiMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'

export type ApiQuery = Record<string, string | undefined>

export type ApiHeaders = Record<string, string | string[] | undefined>

export interface ApiRequest<TBody = unknown> {
  method?: string
  query?: ApiQuery
  headers?: ApiHeaders
  body?: TBody
  url?: string
  ip?: string
}

export interface ApiResponse {
  status: (code: number) => ApiResponse
  json: (payload: unknown) => ApiResponse | void
  send: (payload: unknown) => ApiResponse | void
  setHeader: (
    name: string,
    value: string | number | readonly string[]
  ) => ApiResponse
}

export type ApiHandler<TBody = unknown> = (
  req: ApiRequest<TBody>,
  res: ApiResponse
) => Promise<unknown> | unknown
