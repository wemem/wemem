import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

import { DocAccessDenied, WorkspaceAccessDenied } from '../../fundamentals';
import { Permission } from './types';

export enum PublicPageMode {
  Page,
  Edgeless,
}

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaClient) {}

  /// Start regin: workspace permission
  async get(ws: string, user: string) {
    const data = await this.prisma.workspaceUserPermission.findFirst({
      where: {
        workspaceId: ws,
        userId: user,
        accepted: true,
      },
    });

    return data?.type as Permission;
  }

  /**
   * check whether a workspace exists and has any one can access it
   * @param workspaceId workspace id
   * @returns
   */
  async hasWorkspace(workspaceId: string) {
    return await this.prisma.workspaceUserPermission
      .count({
        where: {
          workspaceId,
          accepted: true,
        },
      })
      .then(count => count > 0);
  }

  async getOwnedWorkspaces(userId: string) {
    return this.prisma.workspaceUserPermission
      .findMany({
        where: {
          userId,
          accepted: true,
          type: Permission.Owner,
        },
        select: {
          workspaceId: true,
        },
      })
      .then(data => data.map(({ workspaceId }) => workspaceId));
  }

  async getWorkspaceOwner(workspaceId: string) {
    return this.prisma.workspaceUserPermission.findFirstOrThrow({
      where: {
        workspaceId,
        type: Permission.Owner,
      },
      include: {
        user: true,
      },
    });
  }

  async tryGetWorkspaceOwner(workspaceId: string) {
    return this.prisma.workspaceUserPermission.findFirst({
      where: {
        workspaceId,
        type: Permission.Owner,
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * check if a doc binary is accessible by a user
   */
  async isPublicAccessible(
    ws: string,
    id: string,
    user?: string
  ): Promise<boolean> {
    if (ws === id) {
      // if workspace is public or have any public page, then allow to access
      const [isPublicWorkspace, publicPages] = await Promise.all([
        this.tryCheckWorkspace(ws, user, Permission.Read),
        this.prisma.workspacePage.count({
          where: {
            workspaceId: ws,
            public: true,
          },
        }),
      ]);
      return isPublicWorkspace || publicPages > 0;
    }

    return this.tryCheckPage(ws, id, user);
  }

  /**
   * Returns whether a given user is a member of a workspace and has the given or higher permission.
   */
  async isWorkspaceMember(
    ws: string,
    user: string,
    permission: Permission
  ): Promise<boolean> {
    const count = await this.prisma.workspaceUserPermission.count({
      where: {
        workspaceId: ws,
        userId: user,
        accepted: true,
        type: {
          gte: permission,
        },
      },
    });

    return count !== 0;
  }

  /**
   * only check permission if the workspace is a cloud workspace
   * @param workspaceId workspace id
   * @param userId user id, check if is a public workspace if not provided
   * @param permission default is read
   */
  async checkCloudWorkspace(
    workspaceId: string,
    userId?: string,
    permission: Permission = Permission.Read
  ) {
    const hasWorkspace = await this.hasWorkspace(workspaceId);
    if (hasWorkspace) {
      await this.checkWorkspace(workspaceId, userId, permission);
    }
  }

  async checkWorkspace(
    ws: string,
    user?: string,
    permission: Permission = Permission.Read
  ) {
    if (!(await this.tryCheckWorkspace(ws, user, permission))) {
      throw new WorkspaceAccessDenied({ workspaceId: ws });
    }
  }

  async tryCheckWorkspace(
    ws: string,
    user?: string,
    permission: Permission = Permission.Read
  ) {
    // If the permission is read, we should check if the workspace is public
    if (permission === Permission.Read) {
      const count = await this.prisma.workspace.count({
        where: { id: ws, public: true },
      });

      // workspace is public
      // accessible
      if (count > 0) {
        return true;
      }
    }

    if (user) {
      // normally check if the user has the permission
      const count = await this.prisma.workspaceUserPermission.count({
        where: {
          workspaceId: ws,
          userId: user,
          accepted: true,
          type: {
            gte: permission,
          },
        },
      });

      return count > 0;
    }

    // unsigned in, workspace is not public
    // unaccessible
    return false;
  }

  async grant(
    ws: string,
    user: string,
    permission: Permission = Permission.Read
  ): Promise<string> {
    const data = await this.prisma.workspaceUserPermission.findFirst({
      where: {
        workspaceId: ws,
        userId: user,
        accepted: true,
      },
    });

    if (data) {
      const [p] = await this.prisma.$transaction(
        [
          this.prisma.workspaceUserPermission.update({
            where: {
              workspaceId_userId: {
                workspaceId: ws,
                userId: user,
              },
            },
            data: {
              type: permission,
            },
          }),

          // If the new permission is owner, we need to revoke old owner
          permission === Permission.Owner
            ? this.prisma.workspaceUserPermission.updateMany({
                where: {
                  workspaceId: ws,
                  type: Permission.Owner,
                  userId: {
                    not: user,
                  },
                },
                data: {
                  type: Permission.Admin,
                },
              })
            : null,
        ].filter(Boolean) as Prisma.PrismaPromise<any>[]
      );

      return p.id;
    }

    return this.prisma.workspaceUserPermission
      .create({
        data: {
          workspaceId: ws,
          userId: user,
          type: permission,
        },
      })
      .then(p => p.id);
  }

  async getWorkspaceInvitation(invitationId: string, workspaceId: string) {
    return this.prisma.workspaceUserPermission.findUniqueOrThrow({
      where: {
        id: invitationId,
        workspaceId,
      },
      include: {
        user: true,
      },
    });
  }

  async acceptWorkspaceInvitation(invitationId: string, workspaceId: string) {
    const result = await this.prisma.workspaceUserPermission.updateMany({
      where: {
        id: invitationId,
        workspaceId: workspaceId,
      },
      data: {
        accepted: true,
      },
    });

    return result.count > 0;
  }

  async revokeWorkspace(ws: string, user: string) {
    const result = await this.prisma.workspaceUserPermission.deleteMany({
      where: {
        workspaceId: ws,
        userId: user,
        type: {
          // We shouldn't revoke owner permission, should auto deleted by workspace/user delete cascading
          not: Permission.Owner,
        },
      },
    });

    return result.count > 0;
  }
  /// End regin: workspace permission

  /// Start regin: page permission
  /**
   * only check permission if the workspace is a cloud workspace
   * @param workspaceId workspace id
   * @param pageId page id aka doc id
   * @param userId user id, check if is a public page if not provided
   * @param permission default is read
   */
  async checkCloudPagePermission(
    workspaceId: string,
    pageId: string,
    userId?: string,
    permission = Permission.Read
  ) {
    const hasWorkspace = await this.hasWorkspace(workspaceId);
    if (hasWorkspace) {
      await this.checkPagePermission(workspaceId, pageId, userId, permission);
    }
  }

  async checkPagePermission(
    ws: string,
    page: string,
    user?: string,
    permission = Permission.Read
  ) {
    if (!(await this.tryCheckPage(ws, page, user, permission))) {
      throw new DocAccessDenied({ workspaceId: ws, docId: page });
    }
  }

  async tryCheckPage(
    ws: string,
    page: string,
    user?: string,
    permission = Permission.Read
  ) {
    // check whether page is public
    if (permission === Permission.Read) {
      const count = await this.prisma.workspacePage.count({
        where: {
          workspaceId: ws,
          pageId: page,
          public: true,
        },
      });

      // page is public
      // accessible
      if (count > 0) {
        return true;
      }
    }

    if (user) {
      const count = await this.prisma.workspacePageUserPermission.count({
        where: {
          workspaceId: ws,
          pageId: page,
          userId: user,
          accepted: true,
          type: {
            gte: permission,
          },
        },
      });

      // page shared to user
      // accessible
      if (count > 0) {
        return true;
      }
    }

    // check whether user has workspace related permission
    return this.tryCheckWorkspace(ws, user, permission);
  }

  async isPublicPage(ws: string, page: string) {
    return this.prisma.workspacePage
      .count({
        where: {
          workspaceId: ws,
          pageId: page,
          public: true,
        },
      })
      .then(count => count > 0);
  }

  async publishPage(ws: string, page: string, mode = PublicPageMode.Page) {
    return this.prisma.workspacePage.upsert({
      where: {
        workspaceId_pageId: {
          workspaceId: ws,
          pageId: page,
        },
      },
      update: {
        public: true,
        mode,
      },
      create: {
        workspaceId: ws,
        pageId: page,
        mode,
        public: true,
      },
    });
  }

  async revokePublicPage(ws: string, page: string) {
    return this.prisma.workspacePage.upsert({
      where: {
        workspaceId_pageId: {
          workspaceId: ws,
          pageId: page,
        },
      },
      update: {
        public: false,
      },
      create: {
        workspaceId: ws,
        pageId: page,
        public: false,
      },
    });
  }

  async grantPage(
    ws: string,
    page: string,
    user: string,
    permission: Permission = Permission.Read
  ) {
    const data = await this.prisma.workspacePageUserPermission.findFirst({
      where: {
        workspaceId: ws,
        pageId: page,
        userId: user,
        accepted: true,
      },
    });

    if (data) {
      const [p] = await this.prisma.$transaction(
        [
          this.prisma.workspacePageUserPermission.update({
            where: {
              id: data.id,
            },
            data: {
              type: permission,
            },
          }),

          // If the new permission is owner, we need to revoke old owner
          permission === Permission.Owner
            ? this.prisma.workspacePageUserPermission.updateMany({
                where: {
                  workspaceId: ws,
                  pageId: page,
                  type: Permission.Owner,
                  userId: {
                    not: user,
                  },
                },
                data: {
                  type: Permission.Admin,
                },
              })
            : null,
        ].filter(Boolean) as Prisma.PrismaPromise<any>[]
      );

      return p.id;
    }

    return this.prisma.workspacePageUserPermission
      .create({
        data: {
          workspaceId: ws,
          pageId: page,
          userId: user,
          type: permission,
        },
      })
      .then(p => p.id);
  }

  async revokePage(ws: string, page: string, user: string) {
    const result = await this.prisma.workspacePageUserPermission.deleteMany({
      where: {
        workspaceId: ws,
        pageId: page,
        userId: user,
        type: {
          // We shouldn't revoke owner permission, should auto deleted by workspace/user delete cascading
          not: Permission.Owner,
        },
      },
    });

    return result.count > 0;
  }
  /// End regin: page permission
}
