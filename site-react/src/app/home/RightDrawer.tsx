import type React from 'react';
import {
  Button,
  Tooltip,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setRightDrawerOpen } from '@/@pango.core/components/drawer/drawerSlice';
import AnnotationDetails from '../annotations/AnnotationDetails';
import { setSelectedAnnotation } from '../annotations/selectedAnnotationSlice';


const RightDrawerContent: React.FC = () => {
  const dispatch = useAppDispatch()
  const selectedAnnotation = useAppSelector((state) => state.selectedAnnotation.selectedAnnotation);

  //console display anselected annotation
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center border-b border-gray-200">
        <span className="text-lg font-medium">Selected Annotation</span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            className="rounded-md"
            onClick={() => {
              dispatch(setRightDrawerOpen(false));
              dispatch(setSelectedAnnotation(null));
            }}
            aria-label="Close dialog"
          >
            Close
          </Button>
        </div>
      </div>
      {selectedAnnotation && (
        <AnnotationDetails annotation={selectedAnnotation} />
      )}
    </div>
  );
};

export default RightDrawerContent;