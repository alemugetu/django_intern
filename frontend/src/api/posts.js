import client from './client'

/**
 * Posts API
 * Each function maps directly to a backend endpoint.
 * Components call these — never axios directly.
 *
 * When `data` is a FormData instance (image upload), axios automatically
 * sets Content-Type to multipart/form-data. For plain JSON payloads the
 * client default of application/json is used.
 */

const multipartHeaders = (data) =>
  data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}

export const getPosts = (params = {}) =>
  client.get('/posts/', { params })

export const getPost = (slug) =>
  client.get(`/posts/${slug}/`)

export const createPost = (data) =>
  client.post('/posts/', data, { headers: multipartHeaders(data) })

export const updatePost = (slug, data) =>
  client.patch(`/posts/${slug}/`, data, { headers: multipartHeaders(data) })

export const deletePost = (slug) =>
  client.delete(`/posts/${slug}/`)

// Tags
export const getTags = () =>
  client.get('/tags/')

// Comments
export const getComments = (slug) =>
  client.get(`/posts/${slug}/comments/`)

export const createComment = (slug, data) =>
  client.post(`/posts/${slug}/comments/`, data)

export const deleteComment = (id) =>
  client.delete(`/comments/${id}/`)
