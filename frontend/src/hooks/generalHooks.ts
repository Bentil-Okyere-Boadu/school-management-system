import { useEffect, useState } from "react";

export const useDebouncer = (value: string, delay: number= 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(
        () => {
          // Update debounced value after delay
          const handler = setTimeout(() => {
            setDebouncedValue(value);
          }, delay);

          return () => {
            clearTimeout(handler);
          };
        },
        [value, delay]
      );
    
      return debouncedValue;
}