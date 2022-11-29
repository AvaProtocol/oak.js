import { DefinitionsCall } from '@polkadot/types/types';

export const runtime: DefinitionsCall = {
  AutomationTimeApi: [
    {
      methods: {
        generate_task_id: {
          description: 'Getting task ID given account ID and provided ID',
          params: [
            { name: 'accountId', type: 'AccountId' },
            { name: 'providedId', type: 'Text' },
          ],
          type: 'Hash',
        },
        get_time_automation_fees: {
          description: 'Retrieve automation fees',
          params: [
            { name: 'action', type: 'AutomationAction' },
            { name: 'executions', type: 'u32' },
          ],
          type: 'Balance',
        },
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
