import { describe, it, expect } from 'vitest'
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import api from '../lib/api'

describe('api error handling', () => {
  it('rejects with the server message and keeps the HTTP status for the caller', async () => {
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const response = {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {},
        config,
        data: { success: false, message: 'Gemini API key is not configured' },
      } as AxiosResponse
      throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, response)
    }

    await expect(api.post('/ai/improve-post', {})).rejects.toMatchObject({
      message: 'Gemini API key is not configured',
      status: 503,
    })
  })
})
