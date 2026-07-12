import axios from 'axios'

// URL base de tu API backend
const api = axios.create({
  baseURL: 'http://localhost:3000'
})

// Interceptor — antes de cada petición, agrega el token automáticamente
// Así no tienes que mandarlo manualmente en cada llamada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api