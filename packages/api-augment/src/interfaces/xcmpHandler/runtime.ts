import { DefinitionsCall } from '@polkadot/types/types';

export const runtime: DefinitionsCall = {
  XcmpHandlerApi: [
    {
      methods: {
        get_time_automation_fees: {
          description: 'Determine fees for a scheduled xcmp task',
          params: [{ name: 'encodedXt', type: 'Bytes' }],
          type: 'u64'
        },
      },
      version: 1
    }
  ]
};
