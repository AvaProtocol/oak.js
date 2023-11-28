import { DefinitionsCall } from '@polkadot/types/types';

export const runtime: DefinitionsCall = {
  AutomationTimeApi: [
    {
      methods: {
        calculate_optimal_autostaking: {
          description: 'Calculate the optimal period to restake',
          params: [
            { name: 'principal', type: 'i128' },
            { name: 'collator', type: 'AccountId' },
          ],
          type: 'AutostakingResult',
        },
        get_auto_compound_delegated_stake_task_ids: {
          description: 'Return autocompounding tasks by account',
          params: [
            { name: 'account_id', type: 'AccountId' },
          ],
          type: 'Vec<Hash>',
        }
      },
      version: 1
    }
  ]
};
