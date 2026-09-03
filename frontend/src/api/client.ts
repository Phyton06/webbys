import { mockApi } from '../data/mock'

// Cliente API que simula llamadas HTTP con datos en localStorage
// Para el prototipo — no hay backend real

function buildResponse(data: any) {
  return { data, status: 200, headers: {} }
}

const api = {
  async get(url: string) {
    try {
      const result = await mockApi.get(url)
      return buildResponse(result.data)
    } catch (e: any) {
      throw e
    }
  },

  async post(url: string, body?: any) {
    try {
      const result = await mockApi.post(url, body)
      return buildResponse(result.data)
    } catch (e: any) {
      throw e
    }
  },

  async put(url: string, body?: any) {
    try {
      const result = await mockApi.put(url, body)
      return buildResponse(result.data)
    } catch (e: any) {
      throw e
    }
  },

  async delete(url: string) {
    try {
      const result = await mockApi.delete(url)
      return buildResponse(result.data)
    } catch (e: any) {
      throw e
    }
  }
}

export default api
