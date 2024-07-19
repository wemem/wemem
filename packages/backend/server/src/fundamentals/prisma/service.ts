import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  static INSTANCE: PrismaService | null = null;

  constructor() {
    super();
    PrismaService.INSTANCE = this;
  }

  async onModuleInit() {
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
