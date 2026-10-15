export type ServiceErrorCode = 'NETWORK' | 'NOT_FOUND' | 'VALIDATION'

export class ServiceError extends Error {
  code: ServiceErrorCode
  constructor(code: ServiceErrorCode, message: string) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
  }
}

// Set localStorage 'mock:fail' = '1' in the browser console to demo the error state.
const FAIL_FLAG = 'mock:fail'

export function simulate<T>(produce: () => T, delayMs = 250): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        if (localStorage.getItem(FAIL_FLAG) === '1') {
          throw new ServiceError('NETWORK', 'Network error (simulated)')
        }
        resolve(produce())
      } catch (error) {
        reject(error)
      }
    }, delayMs)
  })
}
