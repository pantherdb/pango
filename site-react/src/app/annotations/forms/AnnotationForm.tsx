import type React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, FormControl, FormLabel, Button, Autocomplete, Chip } from '@mui/material';
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export interface IFormInput {
  title: string;
  destination: string[];
  description: string;
}

interface AnnotationFormProps {
  onSubmit: (success: boolean) => void;
  onCancel: () => void;
}

export const getErrorMessage = (error: FetchBaseQueryError | SerializedError): string => {
  if ('status' in error) {
    if ('data' in error && typeof error.data === 'object' && error.data !== null) {
      return (error.data as { message?: string }).message || 'Unknown server error';
    }
    return 'Server error';
  }
  return error.message || 'Unknown error';
};

const AnnotationForm: React.FC<AnnotationFormProps> = ({ onSubmit, onCancel }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<IFormInput>();
  const [createAnnotation, { isLoading, isError, error }] = useCreateAnnotationMutation();

  const onSubmitForm = async (data: IFormInput) => {
    try {
      console.log("Submitting form data:", data);
      await createAnnotation(data).unwrap();
      onSubmit(true); // Indicate successful submission
    } catch (err) {
      console.error("Submission error:", err);
      onSubmit(false); // Indicate submission failure
    }
  };

  return (
    <div className="flex flex-auto flex-col p-2">
      <form
        id="annotationForm"
        name="annotationForm"
        noValidate
        className="mt-2 flex w-full flex-col justify-center"
        onSubmit={handleSubmit(onSubmitForm)}
      >
        <FormControl fullWidth margin="normal">
          <FormLabel>Title</FormLabel>
          <TextField
            {...register('title', { required: true })}
            variant="outlined"
            error={!!errors.title}
            helperText={errors.title ? 'Title is required' : ''}
          />
        </FormControl>
        <FormControl fullWidth margin="normal">
          <FormLabel>Destination</FormLabel>
          <Controller
            name="destination"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={field.value || []}
                onChange={(event, newValue) => field.onChange(newValue)}
                renderTags={(value: readonly string[], getTagProps) =>
                  value.map((option: string, index: number) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip key={key} variant="outlined" label={option} {...tagProps} />;
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Add destinations"
                  />
                )}
              />
            )}
          />
        </FormControl>
        <FormControl fullWidth margin="normal">
          <FormLabel>Description</FormLabel>
          <TextField
            {...register('description')}
            variant="outlined"
            multiline
            rows={3}
          />
        </FormControl>
        {isError && <p className="error">An error occurred: {getErrorMessage(error)}</p>}
        <div className="flex justify-end mt-4">
          <Button variant="outlined" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button variant="outlined" color="primary" type="submit" disabled={isLoading} className="ml-2">
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AnnotationForm;
