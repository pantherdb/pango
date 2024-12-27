import type React from 'react';
import { Dialog, DialogContent, TextField, IconButton } from '@mui/material';
import { FiX } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { useCreateAnnotationMutation } from '../annotationsApiSlice';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { closeAnnotationModal } from './annotationModalSlice';
import { Send } from '@mui/icons-material';

export interface IFormInput {
  title: string;
}

interface AnnotationFormModalProps {
  type?: 'text' | 'number' | 'email' | 'tel' | 'url';
}

const AnnotationFormModal: React.FC<AnnotationFormModalProps> = ({ type = 'text' }) => {
  const { open, boardId, parentId } = useAppSelector((state) => state.annotationModal);
  const dispatch = useAppDispatch();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<IFormInput>();
  const [createAnnotation, { isLoading }] = useCreateAnnotationMutation();

  const handleClose = () => {
    reset();
    dispatch(closeAnnotationModal());
  };

  const onSubmitForm = async (data: IFormInput) => {
    try {
      const input = { ...data, boardId };
      await createAnnotation({ input, parentId }).unwrap();
      handleClose();
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      PaperProps={{
        style: {
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          borderRadius: '16px 16px 0 0',
          width: '100%',
          maxHeight: '30vh'
        },
        elevation: 0
      }}
    >
      <DialogContent className="p-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Your Answer</h3>
          <IconButton onClick={handleClose}>
            <FiX />
          </IconButton>
        </div>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <TextField
            {...register('title', { required: true })}
            error={!!errors.title}
            helperText={errors.title ? 'Answer is required' : ''}
            placeholder="Enter answer"
            variant="outlined"
            fullWidth
            type={type}
            autoFocus
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <IconButton type="submit" disabled={isLoading} className="text-blue-500">
                  <Send className="w-5 h-5" />
                </IconButton>
              )
            }}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AnnotationFormModal;