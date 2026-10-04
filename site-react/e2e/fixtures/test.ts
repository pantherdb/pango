import { test as base, expect } from '@playwright/test'
import type { ApiMock } from './mockApi'
import { installApiMock } from './mockApi'

interface Fixtures {
  /** The mocked GraphQL API; `api.lastVariables('GetGenes')` shows what the app asked for. */
  api: ApiMock
  /** Console errors and uncaught exceptions; every test fails if any were logged. */
  consoleErrors: string[]
}

export const test = base.extend<Fixtures>({
  api: [
    async ({ context }, use) => {
      await use(await installApiMock(context))
    },
    { auto: true },
  ],
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text())
      })
      page.on('pageerror', error => errors.push(`Uncaught: ${error.message}`))
      await use(errors)
      expect(errors, 'console errors').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
