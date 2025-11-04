import { UseFormGetValues, UseFormSetValue } from "react-hook-form";

/**
 * Hook for copying a field value to all entries
 * Used for "Copy to All" functionality
 */
export function useCopyToAll<TFormData extends { entries: any[] }>(
  getValues: UseFormGetValues<TFormData>,
  setValue: UseFormSetValue<TFormData>
) {
  const copyFieldToAll = (
    fieldName: "clock_in" | "clock_out" | "break_duration" | "task_description",
    sourceIndex: number
  ) => {
    const entries = getValues().entries;
    const value = entries[sourceIndex][fieldName];
    
    entries.forEach((_, index) => {
      if (index !== sourceIndex) {
        setValue(`entries.${index}.${fieldName}` as any, value);
      }
    });
  };

  return { copyFieldToAll };
}

