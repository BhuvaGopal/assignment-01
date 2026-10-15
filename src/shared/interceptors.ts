import { HttpResponse, RequestConfig } from 'core/request'

export function onRequest(request: RequestConfig) {
  return request
}

export function onResponse(response: HttpResponse) {
  return response
}

export function onError(error: any) {
  console.error('onError', error)
  return Promise.resolve()
}
