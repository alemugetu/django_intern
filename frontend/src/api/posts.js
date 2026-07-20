import client from './client'

/**
 * Posts API
 * Each function maps directly to a backend endpoint.
 * Components call these functions — never axios directly.
 */

export const getPosts = (params = {}) =>
  client.get('/posts/', { params })

export const getPost = (slug) =>
  client.get(`/posts/${slug}/`)

export const createPost = (data) =>
  client.post('/posts/', data)

export const updatePost = (slug, data) =>
  client.patch(`/posts/${slug}/`, data)

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
