declare module '@ai-solutions-ui/form-component' {
  /* base */
  export type FieldType =
    | 'text'
    | 'number'
    | 'email'
    | 'date'
    | 'time'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'multiselect'
    | 'password'
    | 'toggle';

  /* 1.  generic field that keeps the literal key  */
  export interface FormField<K extends string = string> {
    key: K;
    label: string;
    type: FieldType;
    icon?: string;
    options?: readonly { label: string; value: any }[];
    disabledWhen?: (m: any) => boolean;
    hiddenWhen?: (m: any) => boolean;
    validators?: any[];

    // Layout properties
    colSpan?: number;     // Column span (1-12), e.g., 2 = spans 2 columns
    rowSpan?: number;
  }

  export interface FormFieldGroup {
    label: string;        // Group title
    icon?: string;        // Group icon
    fields: string[];     
  }

  /* 2.  narrow an array literal to literal keys  */
  export type NarrowFields<T> = T extends readonly (infer E)[]
    ? E extends FormField<infer K>
      ? FormField<K>
      : never
    : never;

  export type KeysOf<T> = T extends readonly FormField<infer K>[] ? K : never;

  /* 3.  strict config  */
  export interface FormConfig<T extends readonly FormField[] = readonly FormField[]> {
    title?: string;
    fields: T;
    model: Record<KeysOf<T>, NonNullable<any>>;
    extraSection?: { key: string; label: string; type: 'checkbox' | 'radio' };
    buttonLabel?: string | ((m: any) => string);
    showButton?: boolean;

    // Layout configuration
    layout?: 'vertical' | 'grid';  // Default: 'vertical'
    gridColumns?: number;          // Number of columns (default: 1)
    fieldGroups?: FormFieldGroup[];
  }
}
