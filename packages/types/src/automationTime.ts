export default {
  rpc: {
    getTimeAutomationFees: {
      description: 'Retrieve automation fees',
      params: [
        { name: 'action', type: 'AutomationAction' },
        { name: 'executions', type: 'u32' },
      ],
      type: 'Balance',
    },
    calculateOptimalAutostaking: {
      description: 'Calculate the optimal period to restake',
      params: [
        { name: 'principal', type: 'i128' },
        { name: 'collator', type: 'AccountId' },
      ],
      type: 'AutostakingResult',
    },
    getAutoCompoundDelegatedStakeTaskIds: {
      description: 'Return autocompounding tasks by account',
      params: [
        { name: 'account_id', type: 'AccountId' },
      ],
      type: 'Vec<Hash>',
    },
    queryFeeDetails: {
      description: 'The transaction fee details',
      params: [
        { name: 'extrinsic', type: 'Extrinsic' },
      ],
      type: 'AutomationFeeDetails'
    },
  },
  types: {
    AutomationAction: {
      _enum: [
        'NativeTransfer',
        'XCMP',
        'AutoCompoundDelegatedStake'
      ],
    },
    AutostakingResult: {
      period: 'i32',
      apy: 'f64',
    },
    AutomationFeeDetails: {
      scheduleFee: 'Balance',
      executionFee: 'Balance',
    },
  },
  runtime: {
    AutomationTimeApi: [
      {
        methods: {
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
          },
          query_fee_details: {
            description: 'The transaction fee details',
            params: [
              { name: 'extrinsic', type: 'Extrinsic' },
            ],
            type: 'AutomationFeeDetails'
          },
        },
        version: 1
      }
    ]
  }
}
