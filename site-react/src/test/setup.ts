import '@testing-library/jest-dom'
import { vi } from 'vitest'
import type { AppDispatch, RootState } from '../app/store/store'

const mockDispatch = vi.fn()
const mockSelector = vi.fn()

// Mock your custom hooks directly
vi.mock('../app/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: RootState) => any) => mockSelector(selector)
}))

// Basic mock data
const mockState = {
  search: {
    genes: [],
    slimTerms: []
  },
  drawer: {
    leftDrawerOpen: false,
    rightDrawerOpen: false
  }
}

// Mock Redux core (not your custom hooks)
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: RootState) => any) => selector(mockState),
  Provider: ({ children }: { children: React.ReactNode }) => children
}))

vi.mock('@/features/genes/slices/genesApiSlice', () => ({
  useGetGenesStatsQuery: () => ({
    data: {
      slimTermFrequency: {
        buckets: []
      }
    },
    isSuccess: true
  })
}))

vi.mock('@/features/genes/components/forms/GeneForm', () => ({
  __esModule: true,
  default: vi.fn(() => null)
}))

vi.mock('@/features/genes/components/forms/OverrepForm', () => ({
  __esModule: true,
  default: vi.fn(() => null)
}))

vi.mock('@/@pango.core/data/constants', () => ({
  ENVIRONMENT: {
    contactUrl: 'test.com',
    downloadAllDataCSVUrl: 'test.com',
    downloadAllDataJSONUrl: 'test.com',
    downloadAnnotationsGAFUrl: 'test.com',
    downloadEvolutionaryModelsGAFUrl: 'test.com'
  }
}))

