import { assertExists } from '@blocksuite/affine/global/utils';
import { AsyncCall } from 'async-call-rpc';

import type { HelperToMain, MainToHelper } from '../shared/type';
import { exposed } from './provide';

const helperToMainServer: HelperToMain = {
  getMeta: () => {
    assertExists(exposed);
    return exposed;
  },
};

export const mainRPC = AsyncCall<MainToHelper>(helperToMainServer, {
  strict: {
    unknownMessage: false,
  },
  channel: {
    on(listener) {
      const f = (e: Electron.MessageEvent) => {
        listener(e.data);
      };
      process.parentPort.on('message', f);
      return () => {
        process.parentPort.off('message', f);
      };
    },
    send(data) {
      process.parentPort.postMessage(data);
    },
  },
});
