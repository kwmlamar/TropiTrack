import { UseFormGetValues, UseFormSetValue } from "react-hook-form";

/**
 * Hook for carrying down values from the previous row
 * Copies time settings and task description from row above
 */
export function useCarryDown<TFormData extends { entries: any[] }>(
  getValues: UseFormGetValues<TFormData>,
  setValue: UseFormSetValue<TFormData>
) {
  const copyFromPrevious = (index: number) => {
    if (index > 0) {
      const previousEntry = getValues().entries[index - 1];
      
      setValue(`entries.${index}.clock_in` as any, previousEntry.clock_in);
      setValue(`entries.${index}.clock_out` as any, previousEntry.clock_out);
      setValue(`entries.${index}.break_duration` as any, previousEntry.break_duration);
      setValue(`entries.${index}.task_description` as any, previousEntry.task_description);
    }
  };

  return { copyFromPrevious };
}

