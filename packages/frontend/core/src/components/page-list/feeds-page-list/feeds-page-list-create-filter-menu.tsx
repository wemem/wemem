import { MenuIcon, MenuItem, MenuSeparator } from '@affine/component';
import type { Filter, PropertiesMeta, VariableMap } from '@affine/env/filter';
import { useI18n } from '@affine/i18n';
import { CreatedIcon, TagsIcon } from '@blocksuite/icons/rc';

import { FilterTag } from '../filter/filter-tag-translation';
import * as styles from '../filter/index.css';
import { tDate, tTag } from '../filter/logical/custom-type';
import { tArray } from '../filter/logical/typesystem';
import { type FilterVariable } from '../filter/shared-types';
import { filterMatcher } from '../filter/vars';

const variableDefineMap = {
  Created: {
    type: () => tDate.create(),
    icon: <CreatedIcon />,
  },
  Tags: {
    type: meta =>
      tArray(
        tTag.create({
          tags:
            meta.tags?.options.filter(t => {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              if (t.ghost === undefined) {
                return true;
              }
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              return !t.ghost;
            }) ?? [],
        })
      ),
    icon: <TagsIcon />,
  },
} satisfies Record<string, Omit<FilterVariable, 'name'>>;

const vars: FilterVariable[] = Object.entries(variableDefineMap).map(
  ([key, value]) => ({
    name: key as keyof VariableMap,
    type: value.type,
    icon: value.icon,
  })
);

const createDefaultFilter = (
  variable: FilterVariable,
  propertiesMeta: PropertiesMeta
): Filter => {
  const data = filterMatcher.match(variable.type(propertiesMeta));
  if (!data) {
    throw new Error('No matching function found');
  }
  return {
    type: 'filter',
    left: {
      type: 'ref',
      name: variable.name,
    },
    funcName: data.name,
    args: data.defaultArgs().map(value => ({
      type: 'literal',
      value,
    })),
  };
};

export const FeedsPageListCreateFilterMenu = ({
  value,
  onChange,
  propertiesMeta,
}: {
  value: Filter[];
  onChange: (value: Filter[]) => void;
  propertiesMeta: PropertiesMeta;
}) => {
  return (
    <VariableSelect
      propertiesMeta={propertiesMeta}
      selected={value}
      onSelect={filter => {
        onChange([...value, filter]);
      }}
    />
  );
};
export const VariableSelect = ({
  onSelect,
  propertiesMeta,
}: {
  selected: Filter[];
  onSelect: (value: Filter) => void;
  propertiesMeta: PropertiesMeta;
}) => {
  const t = useI18n();
  return (
    <div data-testid="variable-select">
      <div className={styles.variableSelectTitleStyle}>
        {t['com.affine.filter']()}
      </div>
      <MenuSeparator />
      {vars
        // .filter(v => !selected.find(filter => filter.left.name === v.name))
        .map(v => (
          <MenuItem
            // eslint-disable-next-line react/jsx-no-bind, @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            preFix={<MenuIcon>{variableDefineMap[v.name].icon}</MenuIcon>}
            key={v.name}
            onClick={() => {
              onSelect(createDefaultFilter(v, propertiesMeta));
            }}
            className={styles.menuItemStyle}
          >
            <div
              data-testid="variable-select-item"
              className={styles.menuItemTextStyle}
            >
              <FilterTag name={v.name} />
            </div>
          </MenuItem>
        ))}
    </div>
  );
};
