export type InsertToPosition =
  | 'end'
  | 'start'
  | {
      id: string;
      before: boolean;
    };
export type ColumnDataUpdater<
  Data extends Record<string, unknown> = Record<string, unknown>,
> = (data: Data) => Partial<Data>;
