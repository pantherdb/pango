import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resolveApiVersion } from '@/app/store/apiService'
import { getConfig } from './constants'

/** Site configuration (URLs, release info) for the API version selected in the URL. */
export const useConfig = () => {
  const [searchParams] = useSearchParams()
  const version = resolveApiVersion(searchParams.get('apiVersion'))

  return useMemo(() => getConfig(version), [version])
}
