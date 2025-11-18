import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ApiVersion } from '@/app/store/apiService'
import { ApiVersions } from '@/app/store/apiService'
import { getConfig } from './constants'

// Get default version from .env
const DEFAULT_VERSION = (import.meta.env.VITE_PANGO_API_VERSION as ApiVersion) || ApiVersions.V2

export const useConfig = () => {
  const [searchParams] = useSearchParams()

  const config = useMemo(() => {
    const version = (searchParams.get('apiVersion') as ApiVersion) || DEFAULT_VERSION
    return getConfig(version)
  }, [searchParams])

  return config
}
