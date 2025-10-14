import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getConfig } from './constants'

type ApiVersion = 'pango-1' | 'pango-2'

export const useConfig = () => {
  const [searchParams] = useSearchParams()

  const config = useMemo(() => {
    const version = (searchParams.get('apiVersion') as ApiVersion) || 'pango-2'
    return getConfig(version)
  }, [searchParams])

  return config
}
