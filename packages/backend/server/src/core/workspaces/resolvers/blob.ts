import { Logger, UseGuards } from '@nestjs/common';
import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { SafeIntResolver } from 'graphql-scalars';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

import type { FileUpload } from '../../../fundamentals';
import {
  BlobQuotaExceeded,
  CloudThrottlerGuard,
  MakeCache,
  PreventCache,
} from '../../../fundamentals';
import { CurrentUser } from '../../auth';
import { Permission, PermissionService } from '../../permission';
import { QuotaManagementService } from '../../quota';
import { WorkspaceBlobStorage } from '../../storage';
import { WorkspaceBlobSizes, WorkspaceType } from '../types';

@UseGuards(CloudThrottlerGuard)
@Resolver(() => WorkspaceType)
export class WorkspaceBlobResolver {
  logger = new Logger(WorkspaceBlobResolver.name);
  constructor(
    private readonly permissions: PermissionService,
    private readonly quota: QuotaManagementService,
    private readonly storage: WorkspaceBlobStorage
  ) {}

  @ResolveField(() => [String], {
    description: 'List blobs of workspace',
    complexity: 2,
  })
  async blobs(
    @CurrentUser() user: CurrentUser,
    @Parent() workspace: WorkspaceType
  ) {
    await this.permissions.checkWorkspace(workspace.id, user.id);

    return this.storage
      .list(workspace.id)
      .then(list => list.map(item => item.key));
  }

  @ResolveField(() => Int, {
    description: 'Blobs size of workspace',
    complexity: 2,
  })
  async blobsSize(@Parent() workspace: WorkspaceType) {
    return this.storage.totalSize(workspace.id);
  }

  /**
   * @deprecated use `workspace.blobs` instead
   */
  @Query(() => [String], {
    description: 'List blobs of workspace',
    deprecationReason: 'use `workspace.blobs` instead',
  })
  @MakeCache(['blobs'], ['workspaceId'])
  async listBlobs(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId') workspaceId: string
  ) {
    await this.permissions.checkWorkspace(workspaceId, user.id);

    return this.storage
      .list(workspaceId)
      .then(list => list.map(item => item.key));
  }

  /**
   * @deprecated use `user.storageUsage` instead
   */
  @Query(() => WorkspaceBlobSizes, {
    deprecationReason: 'use `user.storageUsage` instead',
  })
  async collectAllBlobSizes(@CurrentUser() user: CurrentUser) {
    const size = await this.quota.getUserUsage(user.id);
    return { size };
  }

  /**
   * @deprecated mutation `setBlob` will check blob limit & quota usage
   */
  @Query(() => WorkspaceBlobSizes, {
    deprecationReason: 'no more needed',
  })
  async checkBlobSize(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId') workspaceId: string,
    @Args('size', { type: () => SafeIntResolver }) blobSize: number
  ) {
    const canWrite = await this.permissions.tryCheckWorkspace(
      workspaceId,
      user.id,
      Permission.Write
    );
    if (canWrite) {
      const size = await this.quota.checkBlobQuota(workspaceId, blobSize);
      return { size };
    }
    return false;
  }

  @Mutation(() => String)
  @PreventCache(['blobs'], ['workspaceId'])
  async setBlob(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId') workspaceId: string,
    @Args({ name: 'blob', type: () => GraphQLUpload })
    blob: FileUpload
  ) {
    await this.permissions.checkWorkspace(
      workspaceId,
      user.id,
      Permission.Write
    );

    const checkExceeded =
      await this.quota.getQuotaCalculatorByWorkspace(workspaceId);

    // TODO(@darksky): need a proper way to separate `BlobQuotaExceeded` and `BlobSizeTooLarge`
    if (checkExceeded(0)) {
      throw new BlobQuotaExceeded();
    }
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const stream = blob.createReadStream();
      const chunks: Uint8Array[] = [];
      stream.on('data', chunk => {
        chunks.push(chunk);

        // check size after receive each chunk to avoid unnecessary memory usage
        const bufferSize = chunks.reduce((acc, cur) => acc + cur.length, 0);
        if (checkExceeded(bufferSize)) {
          reject(new BlobQuotaExceeded());
        }
      });
      stream.on('error', reject);
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);

        if (checkExceeded(buffer.length)) {
          reject(new BlobQuotaExceeded());
        } else {
          resolve(buffer);
        }
      });
    });

    await this.storage.put(workspaceId, blob.filename, buffer);
    return blob.filename;
  }

  @Mutation(() => Boolean)
  @PreventCache(['blobs'], ['workspaceId'])
  async deleteBlob(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId') workspaceId: string,
    @Args('hash') name: string
  ) {
    await this.permissions.checkWorkspace(workspaceId, user.id);

    await this.storage.delete(workspaceId, name);

    return true;
  }
}
