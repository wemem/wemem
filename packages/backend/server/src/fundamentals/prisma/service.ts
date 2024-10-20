import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  static INSTANCE: PrismaService | null = null;

  constructor(opts: Prisma.PrismaClientOptions) {
    super(opts);
    PrismaService.INSTANCE = this;
  }

  async onModuleInit() {
    //@ts-expect-error: 暂时没有找到更好的方法
    this.$on<'query'>('query', e => {
      console.log('Query: ' + e.query);
      console.log('Params: ' + e.params);
      console.log('Duration: ' + e.duration + 'ms');
    });
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (!AFFiNE.node.test) {
      await this.$disconnect();
      PrismaService.INSTANCE = null;
    }
  }
}
