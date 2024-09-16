import { Column } from './data-view/view/presets/table/types';

export type ColumnUpdater<T extends Column = Column> = (data: T) => Partial<T>;
export type Cell<ValueType = unknown> = {
  columnId: Column['id'];
  value: ValueType;
};

export interface DatabaseFlags {
  enable_number_formatting: boolean;
  enable_database_statistics: boolean;
}

export const defaultDatabaseFlags: Readonly<DatabaseFlags> = {
  enable_number_formatting: false,
  enable_database_statistics: false,
};
