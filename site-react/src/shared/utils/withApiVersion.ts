/**
 * Carries the current page's `?apiVersion=` over to `url`, so navigation stays on the API version
 * the user picked.
 */
export const withApiVersion = (url: string, search: string = window.location.search): string => {
  const apiVersion = new URLSearchParams(search).get('apiVersion')
  if (!apiVersion) return url
  return `${url}${url.includes('?') ? '&' : '?'}apiVersion=${encodeURIComponent(apiVersion)}`
}
