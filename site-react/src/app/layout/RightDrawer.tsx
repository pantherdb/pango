import type React from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setRightDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice'
import { setSelectedAnnotation } from '@/features/annotations/slices/selectedAnnotationSlice'
import AnnotationDetails from '@/features/annotations/components/AnnotationDetails'
import Button from '@mui/material/Button'

// TODO style left drawer
const RightDrawerContent: React.FC = () => {
  const dispatch = useAppDispatch()
  const selectedAnnotation = useAppSelector(state => state.selectedAnnotation.selectedAnnotation)

  //console display anselected annotation
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-gray-200 p-4">
        <span className="text-lg font-medium">Selected Annotation</span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            className="rounded-md"
            onClick={() => {
              dispatch(setRightDrawerOpen(false))
              dispatch(setSelectedAnnotation(null))
            }}
            aria-label="Close dialog"
          >
            Close
          </Button>
        </div>
      </div>
      {selectedAnnotation && <AnnotationDetails annotation={selectedAnnotation} />}
    </div>
  )
}

export default RightDrawerContent
