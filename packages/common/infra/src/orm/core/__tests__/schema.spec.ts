import { nanoid } from 'nanoid';
import { describe, expect, test } from 'vitest';

import {
  createORMClient,
  type DBSchemaBuilder,
  f,
  MemoryORMAdapter,
} from '../';

function createClient<Schema extends DBSchemaBuilder>(schema: Schema) {
  return createORMClient(schema, MemoryORMAdapter);
}

describe('Schema validations', () => {
  test('primary key must be set', () => {
    expect(() =>
      createClient({
        tags: {
          id: f.string(),
          name: f.string(),
        },
      })
    ).toThrow(
      '[Table(tags)]: There should be at least one field marked as primary key.'
    );
  });

  test('primary key must be unique', () => {
    expect(() =>
      createClient({
        tags: {
          id: f.string().primaryKey(),
          name: f.string().primaryKey(),
        },
      })
    ).toThrow(
      '[Table(tags)]: There should be only one field marked as primary key.'
    );
  });

  test('primary key should not be optional without default value', () => {
    expect(() =>
      createClient({
        tags: {
          id: f.string().primaryKey().optional(),
          name: f.string(),
        },
      })
    ).toThrow(
      "[Table(tags)]: Field 'id' can't be marked primary key and optional with no default value provider at the same time."
    );
  });

  test('primary key can be optional with default value', async () => {
    expect(() =>
      createClient({
        tags: {
          id: f.string().primaryKey().optional().default(nanoid),
          name: f.string(),
        },
      })
    ).not.throws();
  });
});

describe('Entity validations', () => {
  function createTagsClient() {
    return createClient({
      tags: {
        id: f.string().primaryKey().default(nanoid),
        name: f.string(),
        color: f.string(),
      },
    });
  }

  test('should not update primary key', () => {
    const client = createTagsClient();

    const tag = client.tags.create({
      name: 'tag',
      color: 'blue',
    });

    // @ts-expect-error test
    expect(() => client.tags.update(tag.id, { id: 'new-id' })).toThrow(
      "[Table(tags)]: Primary key field 'id' can't be updated."
    );
  });

  test('should throw when trying to create entity with missing required field', () => {
    const client = createTagsClient();

    // @ts-expect-error test
    expect(() => client.tags.create({ name: 'test' })).toThrow(
      "[Table(tags)]: Field 'color' is required but not set."
    );
  });

  test('should throw when trying to create entity with extra field', () => {
    const client = createTagsClient();

    expect(() =>
      // @ts-expect-error test
      client.tags.create({ name: 'test', color: 'red', extra: 'field' })
    ).toThrow("[Table(tags)]: Field 'extra' is not defined but set in entity.");
  });

  test('should throw when trying to create entity with unexpected field type', () => {
    const client = createTagsClient();

    // @ts-expect-error test
    expect(() => client.tags.create({ name: 'test', color: 123 })).toThrow(
      "[Table(tags)]: Field 'color' type mismatch. Expected type 'string' but got 'number'."
    );

    // @ts-expect-error test
    expect(() => client.tags.create({ name: 'test', color: [123] })).toThrow(
      "[Table(tags)]: Field 'color' type mismatch. Expected type 'string' but got 'json'"
    );
  });

  test('should be able to assign `null` to json field', () => {
    expect(() => {
      const client = createClient({
        tags: {
          id: f.string().primaryKey().default(nanoid),
          info: f.json(),
        },
      });

      const tag = client.tags.create({ info: null });

      expect(tag.info).toBe(null);
    });
  });
});
