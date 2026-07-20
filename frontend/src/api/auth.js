import client from './client'

export const loginUser = (credentials) =>
  client.post('/auth/login/', credentials)

export const registerUser = (data) =>
  client.post('/auth/register/', data)

export const logoutUser = () =>
  client.post('/auth/logout/')

export const getMe = () =>
  client.get('/auth/me/')
