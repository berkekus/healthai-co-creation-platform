// API adresi için tek kaynak — tüm dosyalar buradan okur (port/fallback tutarsızlığını önler)
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

// Origin (protokol + host) — /uploads gibi API dışı yollar ve socket bağlantısı için
export const API_ORIGIN: string = API_URL.replace(/\/api\/?$/, '')
