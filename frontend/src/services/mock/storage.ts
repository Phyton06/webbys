// Shared localStorage utilities for mock services
// Read-modify-write pattern for concurrent safety

export function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

export function loadOne<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function saveOne<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function genId() {
  return Math.random().toString(36).slice(2, 11)
}

export function delay(ms = 50) {
  return new Promise(r => setTimeout(r, ms))
}
