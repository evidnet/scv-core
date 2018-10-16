import fetch from 'node-fetch'

export interface ImageInfo {
  name: string
  full_size: number
  id: number
  repository: number
  creator: number
  last_updater: number
  last_updated: string
  v2: boolean
}

export interface TagResponse {
  count: number
  next: string | null
  previous: string | null
  results: Array<ImageInfo>
}

const defaultUrl = 'https://registry.hub.docker.com/v2/repositories/${project}/tags/'

/**
 * Get Docker Project's own tags.
 *
 * @export
 * @param {string} project project's name
 * @param {string} [baseUrl=defaultUrl] default is docker registry's api url.
 * @returns {Promise<string[]>}
 */
export default async function getTags (project: string, baseUrl: string = defaultUrl): Promise<string[]> {
  const response = await fetch(baseUrl.split('${project}').join(project), { method: 'GET' })
  const body: TagResponse = await response.json()
  return body.results.map(result => result.name)
}
