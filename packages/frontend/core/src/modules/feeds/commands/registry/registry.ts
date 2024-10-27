import {
  type AffineCommand,
  type AffineCommandOptions,
  createAffineCommand,
} from '@affine/core/commands';
import { DebugLogger } from '@affine/debug';
// @ts-expect-error upstream type is wrong
import { tinykeys } from 'tinykeys';

const commandLogger = new DebugLogger('feedSearch:command:registry');

export const FeedSearchCommandRegistry = new (class {
  readonly commands: Map<string, AffineCommand> = new Map();

  register(options: AffineCommandOptions) {
    if (this.commands.has(options.id)) {
      commandLogger.warn(`Command ${options.id} already registered.`);
      return () => {};
    }
    const command = createAffineCommand(options);
    this.commands.set(command.id, command);

    let unsubKb: (() => void) | undefined;

    if (
      command.keyBinding &&
      !command.keyBinding.skipRegister &&
      typeof window !== 'undefined'
    ) {
      const { binding: keybinding } = command.keyBinding;
      unsubKb = tinykeys(window, {
        [keybinding]: async (e: Event) => {
          e.preventDefault();
          try {
            await command.run();
          } catch (e) {
            console.error(`Failed to invoke keybinding [${keybinding}]`, e);
          }
        },
      });
    }

    commandLogger.debug(`Registered command ${command.id}`);
    return () => {
      unsubKb?.();
      this.commands.delete(command.id);
      commandLogger.debug(`Unregistered command ${command.id}`);
    };
  }

  get(id: string): AffineCommand | undefined {
    if (!this.commands.has(id)) {
      commandLogger.warn(`Command ${id} not registered.`);
      return undefined;
    }
    return this.commands.get(id);
  }

  getAll(): AffineCommand[] {
    return Array.from(this.commands.values());
  }
})();

export function registerNewFeedCommand(options: AffineCommandOptions) {
  return FeedSearchCommandRegistry.register(options);
}
