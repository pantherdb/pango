import { describe, expect, it } from 'vitest'
import { buildAnnotation } from '@tests/fixtures/builders'
import selectedAnnotationReducer, {
  selectedAnnotationSlice,
  setSelectedAnnotation,
} from '@/features/annotations/slices/selectedAnnotationSlice'

describe('selectedAnnotationSlice', () => {
  it('selects an annotation for the details drawer and clears it', () => {
    const annotation = buildAnnotation()
    const initial = selectedAnnotationSlice.getInitialState()
    expect(initial.selectedAnnotation).toBeNull()

    const selected = selectedAnnotationReducer(initial, setSelectedAnnotation(annotation))
    expect(selected.selectedAnnotation).toEqual(annotation)

    expect(
      selectedAnnotationReducer(selected, setSelectedAnnotation(null)).selectedAnnotation
    ).toBeNull()
  })
})
