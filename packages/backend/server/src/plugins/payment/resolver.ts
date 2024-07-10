import {
  Args,
  Context,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Parent,
  Query,
  registerEnumType,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { User, UserInvoice, UserSubscription } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { groupBy } from 'lodash-es';

import { CurrentUser, Public } from '../../core/auth';
import { UserType } from '../../core/user';
import {
  AccessDenied,
  Config,
  FailedToCheckout,
  URLHelper,
} from '../../fundamentals';
import { decodeLookupKey, SubscriptionService } from './service';
import {
  InvoiceStatus,
  SubscriptionPlan,
  SubscriptionRecurring,
  SubscriptionStatus,
} from './types';

registerEnumType(SubscriptionStatus, { name: 'SubscriptionStatus' });
registerEnumType(SubscriptionRecurring, { name: 'SubscriptionRecurring' });
registerEnumType(SubscriptionPlan, { name: 'SubscriptionPlan' });
registerEnumType(InvoiceStatus, { name: 'InvoiceStatus' });

@ObjectType()
class SubscriptionPrice {
  @Field(() => String)
  type!: 'fixed';

  @Field(() => SubscriptionPlan)
  plan!: SubscriptionPlan;

  @Field()
  currency!: string;

  @Field(() => Int, { nullable: true })
  amount?: number | null;

  @Field(() => Int, { nullable: true })
  yearlyAmount?: number | null;

  @Field(() => Int, { nullable: true })
  lifetimeAmount?: number | null;
}

@ObjectType('UserSubscription')
export class UserSubscriptionType implements Partial<UserSubscription> {
  @Field(() => String, { name: 'id', nullable: true })
  stripeSubscriptionId!: string | null;

  @Field(() => SubscriptionPlan, {
    description:
      "The 'Free' plan just exists to be a placeholder and for the type convenience of frontend.\nThere won't actually be a subscription with plan 'Free'",
  })
  plan!: SubscriptionPlan;

  @Field(() => SubscriptionRecurring)
  recurring!: SubscriptionRecurring;

  @Field(() => SubscriptionStatus)
  status!: SubscriptionStatus;

  @Field(() => Date)
  start!: Date;

  @Field(() => Date, { nullable: true })
  end!: Date | null;

  @Field(() => Date, { nullable: true })
  trialStart?: Date | null;

  @Field(() => Date, { nullable: true })
  trialEnd?: Date | null;

  @Field(() => Date, { nullable: true })
  nextBillAt?: Date | null;

  @Field(() => Date, { nullable: true })
  canceledAt?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType('UserInvoice')
class UserInvoiceType implements Partial<UserInvoice> {
  @Field({ name: 'id' })
  stripeInvoiceId!: string;

  @Field(() => SubscriptionPlan)
  plan!: SubscriptionPlan;

  @Field(() => SubscriptionRecurring)
  recurring!: SubscriptionRecurring;

  @Field()
  currency!: string;

  @Field()
  amount!: number;

  @Field(() => InvoiceStatus)
  status!: InvoiceStatus;

  @Field()
  reason!: string;

  @Field(() => String, { nullable: true })
  lastPaymentError?: string | null;

  @Field(() => String, { nullable: true })
  link?: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@InputType()
class CreateCheckoutSessionInput {
  @Field(() => SubscriptionRecurring, {
    nullable: true,
    defaultValue: SubscriptionRecurring.Yearly,
  })
  recurring!: SubscriptionRecurring;

  @Field(() => SubscriptionPlan, {
    nullable: true,
    defaultValue: SubscriptionPlan.Pro,
  })
  plan!: SubscriptionPlan;

  @Field(() => String, { nullable: true })
  coupon!: string | null;

  @Field(() => String)
  successCallbackLink!: string;

  // @FIXME(forehalo): we should put this field in the header instead of as a explicity args
  @Field(() => String)
  idempotencyKey!: string;
}

@Resolver(() => UserSubscriptionType)
export class SubscriptionResolver {
  constructor(
    private readonly service: SubscriptionService,
    private readonly url: URLHelper
  ) {}

  @Public()
  @Query(() => [SubscriptionPrice])
  async prices(
    @CurrentUser() user?: CurrentUser
  ): Promise<SubscriptionPrice[]> {
    const prices = await this.service.listPrices(user);

    const group = groupBy(prices, price => {
      // @ts-expect-error empty lookup key is filtered out
      const [plan] = decodeLookupKey(price.lookup_key);
      return plan;
    });

    function findPrice(plan: SubscriptionPlan) {
      const prices = group[plan];

      if (!prices) {
        return null;
      }

      const monthlyPrice = prices.find(p => p.recurring?.interval === 'month');
      const yearlyPrice = prices.find(p => p.recurring?.interval === 'year');
      const lifetimePrice = prices.find(
        p =>
          // asserted before
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          decodeLookupKey(p.lookup_key!)[1] === SubscriptionRecurring.Lifetime
      );
      const currency = monthlyPrice?.currency ?? yearlyPrice?.currency ?? 'usd';

      return {
        currency,
        amount: monthlyPrice?.unit_amount,
        yearlyAmount: yearlyPrice?.unit_amount,
        lifetimeAmount: lifetimePrice?.unit_amount,
      };
    }

    // extend it when new plans are added
    const fixedPlans = [SubscriptionPlan.Pro, SubscriptionPlan.AI];

    return fixedPlans.reduce((prices, plan) => {
      const price = findPrice(plan);

      if (price && (price.amount || price.yearlyAmount)) {
        prices.push({
          type: 'fixed',
          plan,
          ...price,
        });
      }

      return prices;
    }, [] as SubscriptionPrice[]);
  }

  @Mutation(() => String, {
    description: 'Create a subscription checkout link of stripe',
  })
  async createCheckoutSession(
    @CurrentUser() user: CurrentUser,
    @Args({ name: 'input', type: () => CreateCheckoutSessionInput })
    input: CreateCheckoutSessionInput
  ) {
    const session = await this.service.createCheckoutSession({
      user,
      plan: input.plan,
      recurring: input.recurring,
      promotionCode: input.coupon,
      redirectUrl: this.url.link(input.successCallbackLink),
      idempotencyKey: input.idempotencyKey,
    });

    if (!session.url) {
      throw new FailedToCheckout();
    }

    return session.url;
  }

  @Mutation(() => String, {
    description: 'Create a stripe customer portal to manage payment methods',
  })
  async createCustomerPortal(@CurrentUser() user: CurrentUser) {
    return this.service.createCustomerPortal(user.id);
  }

  @Mutation(() => UserSubscriptionType)
  async cancelSubscription(
    @CurrentUser() user: CurrentUser,
    @Args({
      name: 'plan',
      type: () => SubscriptionPlan,
      nullable: true,
      defaultValue: SubscriptionPlan.Pro,
    })
    plan: SubscriptionPlan,
    @Args('idempotencyKey') idempotencyKey: string
  ) {
    return this.service.cancelSubscription(idempotencyKey, user.id, plan);
  }

  @Mutation(() => UserSubscriptionType)
  async resumeSubscription(
    @CurrentUser() user: CurrentUser,
    @Args({
      name: 'plan',
      type: () => SubscriptionPlan,
      nullable: true,
      defaultValue: SubscriptionPlan.Pro,
    })
    plan: SubscriptionPlan,
    @Args('idempotencyKey') idempotencyKey: string
  ) {
    return this.service.resumeCanceledSubscription(
      idempotencyKey,
      user.id,
      plan
    );
  }

  @Mutation(() => UserSubscriptionType)
  async updateSubscriptionRecurring(
    @CurrentUser() user: CurrentUser,
    @Args({ name: 'recurring', type: () => SubscriptionRecurring })
    recurring: SubscriptionRecurring,
    @Args({
      name: 'plan',
      type: () => SubscriptionPlan,
      nullable: true,
      defaultValue: SubscriptionPlan.Pro,
    })
    plan: SubscriptionPlan,
    @Args('idempotencyKey') idempotencyKey: string
  ) {
    return this.service.updateSubscriptionRecurring(
      idempotencyKey,
      user.id,
      plan,
      recurring
    );
  }
}

@Resolver(() => UserType)
export class UserSubscriptionResolver {
  constructor(
    private readonly config: Config,
    private readonly db: PrismaClient
  ) {}

  @ResolveField(() => UserSubscriptionType, {
    nullable: true,
    deprecationReason: 'use `UserType.subscriptions`',
  })
  async subscription(
    @Context() ctx: { isAdminQuery: boolean },
    @CurrentUser() me: User,
    @Parent() user: User,
    @Args({
      name: 'plan',
      type: () => SubscriptionPlan,
      nullable: true,
      defaultValue: SubscriptionPlan.Pro,
    })
    plan: SubscriptionPlan
  ) {
    // allow admin to query other user's subscription
    if (!ctx.isAdminQuery && me.id !== user.id) {
      throw new AccessDenied();
    }

    // @FIXME(@forehalo): should not mock any api for selfhosted server
    // the frontend should avoid calling such api if feature is not enabled
    if (this.config.isSelfhosted) {
      const start = new Date();
      const end = new Date();
      end.setFullYear(start.getFullYear() + 1);

      return {
        stripeSubscriptionId: 'dummy',
        plan: SubscriptionPlan.SelfHosted,
        recurring: SubscriptionRecurring.Yearly,
        status: SubscriptionStatus.Active,
        start,
        end,
        createdAt: start,
        updatedAt: start,
      };
    }

    return this.db.userSubscription.findUnique({
      where: {
        userId_plan: {
          userId: user.id,
          plan,
        },
        status: SubscriptionStatus.Active,
      },
    });
  }

  @ResolveField(() => [UserSubscriptionType])
  async subscriptions(
    @CurrentUser() me: User,
    @Parent() user: User
  ): Promise<UserSubscription[]> {
    if (me.id !== user.id) {
      throw new AccessDenied();
    }

    return this.db.userSubscription.findMany({
      where: {
        userId: user.id,
        status: SubscriptionStatus.Active,
      },
    });
  }

  @ResolveField(() => [UserInvoiceType])
  async invoices(
    @CurrentUser() me: User,
    @Parent() user: User,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 8 })
    take: number,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number
  ) {
    if (me.id !== user.id) {
      throw new AccessDenied();
    }

    return this.db.userInvoice.findMany({
      where: {
        userId: user.id,
      },
      take,
      skip,
      orderBy: {
        id: 'desc',
      },
    });
  }
}
