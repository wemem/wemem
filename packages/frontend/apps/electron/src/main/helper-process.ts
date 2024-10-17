import path from 'node:path';

import type { _AsyncVersionOf } from 'async-call-rpc';
import { AsyncCall } from 'async-call-rpc';
import type { UtilityProcess, WebContents } from 'electron';
import {
  app,
  dialog,
  MessageChannelMain,
  shell,
  utilityProcess,
} from 'electron';

import type { HelperToMain, MainToHelper } from '../shared/type';
import { MessageEventChannel } from '../shared/utils';
import { logger } from './logger';

const HELPER_PROCESS_PATH = path.join(__dirname, './helper.js');

const isDev = process.env.NODE_ENV === 'development';

function pickAndBind<T extends object, U extends keyof T>(
  obj: T,
  keys: U[]
): { [K in U]: T[K] } {
  return keys.reduce((acc, key) => {
    const prop = obj[key];
    acc[key] = typeof prop === 'function' ? prop.bind(obj) : prop;
    return acc;
  }, {} as any);
}

class HelperProcessManager {
  ready: Promise<void>;
  readonly #process: UtilityProcess;

  // a rpc server for the main process -> helper process
  rpc?: _AsyncVersionOf<HelperToMain>;

  static _instance: HelperProcessManager | null = null;

  static get instance() {
    if (!this._instance) {
      this._instance = new HelperProcessManager();
    }
    return this._instance;
  }

  private constructor() {
    const helperProcess = utilityProcess.fork(HELPER_PROCESS_PATH, [], {
      // todo: port number should not being used
      execArgv: isDev ? ['--inspect=40894'] : [],
    });
    this.#process = helperProcess;
    this.ready = new Promise((resolve, reject) => {
      helperProcess.once('spawn', () => {
        try {
          this.#connectMain();
          logger.info('[helper] forked', helperProcess.pid);
          resolve();
        } catch (err) {
          logger.error('[helper] connectMain error', err);
          reject(err);
        }
      });
    });

    app.on('before-quit', () => {
      this.#process.kill();
    });
  }

  // bridge renderer <-> helper process
  connectRenderer(renderer: WebContents) {
    // connect to the helper process
    const { port1: helperPort, port2: rendererPort } = new MessageChannelMain();
    this.#process.postMessage({ channel: 'renderer-connect' }, [helperPort]);
    renderer.postMessage('helper-connection', null, [rendererPort]);

    return () => {
      helperPort.close();
      rendererPort.close();
    };
  }

  // bridge main <-> helper process
  // also set up the RPC to the helper process
  #connectMain() {
    const dialogMethods = pickAndBind(dialog, [
      'showOpenDialog',
      'showSaveDialog',
    ]);
    const shellMethods = pickAndBind(shell, [
      'openExternal',
      'showItemInFolder',
    ]);
    const appMethods = pickAndBind(app, ['getPath']);

    const mainToHelperServer: MainToHelper = {
      ...dialogMethods,
      ...shellMethods,
      ...appMethods,
    };

    this.rpc = AsyncCall<HelperToMain>(mainToHelperServer, {
      strict: {
        // the channel is shared for other purposes as well so that we do not want to
        // restrict to only JSONRPC messages
        unknownMessage: false,
      },
      channel: new MessageEventChannel(this.#process),
    });
  }
}

export async function ensureHelperProcess() {
  const helperProcessManager = HelperProcessManager.instance;
  await helperProcessManager.ready;
  return helperProcessManager;
}
