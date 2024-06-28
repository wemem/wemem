import './config';

import { STATUS_CODES } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { Global, HttpStatus, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { GraphQLError } from 'graphql';

import { Config } from '../config';
import { UserFriendlyError } from '../error';
import { GQLLoggerPlugin } from './logger-plugin';

export type GraphqlContext = {
  req: Request;
  res: Response;
  isAdminQuery: boolean;
};

@Global()
@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (config: Config) => {
        return {
          ...config.graphql,
          path: `${config.server.path}/graphql`,
          csrfPrevention: {
            requestHeaders: ['content-type'],
          },
          autoSchemaFile: join(
            fileURLToPath(import.meta.url),
            config.node.test
              ? '../../../../node_modules/.cache/schema.gql'
              : '../../../schema.gql'
          ),
          sortSchema: true,
          context: ({
            req,
            res,
          }: {
            req: Request;
            res: Response;
          }): GraphqlContext => ({
            req,
            res,
            isAdminQuery: false,
          }),
          includeStacktraceInErrorResponses: !config.node.prod,
          plugins: [new GQLLoggerPlugin()],
          formatError: (formattedError, error) => {
            // @ts-expect-error allow assign
            formattedError.extensions ??= {};

            if (
              error instanceof GraphQLError &&
              error.originalError instanceof UserFriendlyError
            ) {
              // @ts-expect-error allow assign
              formattedError.extensions = error.originalError.toJSON();
              formattedError.extensions.stacktrace = error.originalError.stack;
              return formattedError;
            } else {
              // @ts-expect-error allow assign
              formattedError.message = 'Internal Server Error';

              formattedError.extensions['status'] =
                HttpStatus.INTERNAL_SERVER_ERROR;
              formattedError.extensions['code'] =
                STATUS_CODES[HttpStatus.INTERNAL_SERVER_ERROR];
            }

            return formattedError;
          },
        };
      },
      inject: [Config],
    }),
  ],
})
export class GqlModule {}
