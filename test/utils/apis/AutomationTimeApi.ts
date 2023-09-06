import _ from 'lodash'
import { ApiPromise } from '@polkadot/api'
import { Signer, SubmittableExtrinsic, AddressOrPair } from '@polkadot/api/types'
import { Balance } from '@polkadot/types/interfaces'
import { ISubmittableResult } from '@polkadot/types/types'
import { HexString } from '@polkadot/util/types'

import {
  LOWEST_TRANSFERRABLE_AMOUNT,
  MIN_IN_HOUR,
  MS_IN_SEC,
  RECURRING_TASK_LIMIT,
  SEC_IN_MIN,
} from '../constants'

/**
 * The constructor takes the input to create an API client to connect to the blockchain.
 * Further commands are performed via this API client in order to reach the blockchain.
 * @param chain: OakChains
 */
export class AutomationTimeApi {
  polkadotApi: ApiPromise
  schedulingTimeLimit: number

  /**
   * constructor
   * @param chain 
   * @param options { providerUrl }, You can specify a custom provider url.
   */
  constructor(config: any, api: ApiPromise) {
    this.polkadotApi = api;
    this.schedulingTimeLimit = config.schedulingTimeLimit;
  }

  /**
   * Creates the API client if one does not already exist
   * @returns ApiPromise
   */
  private async getAPIClient(): Promise<ApiPromise> {
    return this.polkadotApi;
  }

  /**
   * Converts timestamps from milliseconds into seconds for Polkadot API consumption
   * @param startTimestamps
   * @returns timestamp[] in seconds
   */
  private convertToSeconds(startTimestamps: number[]): number[] {
    return _.map(startTimestamps, (startTimestamp: number) => {
      const isMillisecond = startTimestamp > 100000000000
      if (isMillisecond) return startTimestamp / MS_IN_SEC
      return startTimestamp
    })
  }

  /**
   * GetInclusionFees: gets the fees for inclusion ONLY.
   * This does not include execution fees.
   * @param extrinsic
   * @param address
   * @returns fee
   */
  async getInclusionFees(
    extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>,
    address: string
  ): Promise<Balance> {
    const paymentInfo = await extrinsic.paymentInfo(address)
    return paymentInfo.partialFee
  }

  /**
   * crossChainAccount: OAK's XCMP account on another chain.
   * Account ID is required input
   * Account ID will be returned.
   * @param accountId
   * @returns accountId
   */
  async crossChainAccount(accountId: string): Promise<string> {
    const polkadotApi = await this.getAPIClient()
    // TODO: hack until we can merge correct types into polkadotAPI
    const resultCodec = await (polkadotApi.rpc as any).xcmpHandler.crossChainAccount(accountId)
    return resultCodec.toString()
  }

  /**
   * fees: Retreive fees required for scheduling an XCMP task
   * Encoded extrinsic is required input
   * Fee will be returned
   * @param encodedXt
   * @returns fee
   */
  async fees(encodedXt: string): Promise<string> {
    const polkadotApi = await this.getAPIClient()
    // TODO: hack until we can merge correct types into polkadotAPI
    const resultCodec = await (polkadotApi.rpc as any).xcmpHandler.fees(encodedXt)
    return resultCodec.toPrimitive()
  }

  /**
   * validateTimestamps: validates timestamps. If not valid, will error.
   * If valid, nothing is returned. Called in buildScheduleNotifyExtrinsic
   * and buildScheduleNativeTransferExtrinsic.
   *
   * Timestamps must be:
   * 1. on the hour
   * 2. in a future time slot, but within a chain-dependent scheduling limit.
   * 3. limited to 24 time slots
   *
   * @param timestamps
   */
  validateTimestamps(timestamps: number[]): void {
    if (timestamps.length > RECURRING_TASK_LIMIT)
      throw new Error(`Recurring Task length cannot exceed ${RECURRING_TASK_LIMIT}`)
    const currentTime = Date.now()
    const nextAvailableHour =
      (currentTime - (currentTime % (SEC_IN_MIN * MIN_IN_HOUR * MS_IN_SEC)) + SEC_IN_MIN * MIN_IN_HOUR * MS_IN_SEC) /
      1000
    _.forEach(timestamps, (timestamp) => {
      if (timestamp < nextAvailableHour) throw new Error('Scheduled timestamp in the past')
      if (timestamp % (SEC_IN_MIN * MIN_IN_HOUR) !== 0) throw new Error('Timestamp is not an hour timestamp')
      if (timestamp > currentTime + this.schedulingTimeLimit) throw new Error('Timestamp too far in future')
    })
  }

  /**
   * validateTransferParams: validates Native Transfer params. If not valid, will error.
   * If valid, nothing is returned. Called in buildScheduleNativeTransferExtrinsic.
   *
   * Native Transfer Params:
   * 1. Must send a baseline amount of 1_000_000_000 plancks (0.1 STUR/TUR).
   * 2. The receiving address must not be the same as that of the sender.
   *
   * @param amount
   * @param sendingAddress
   * @param receivingAddress
   */
  validateTransferParams(amount: number, sendingAddress: AddressOrPair, receivingAddress: string): void {
    if (amount < LOWEST_TRANSFERRABLE_AMOUNT) throw new Error(`Amount too low`)
    if (sendingAddress === receivingAddress) throw new Error(`Cannot send to self`)
  }

  async buildScheduleDynamicDispatchTask(
    address: AddressOrPair,
    schedule: { recurring: { frequency: number, nextExecutionTime: number }, fixed: { executionTimes: Array<number> } },
    call: object,
    signer?: Signer
  ): Promise<HexString> {
    const polkadotApi = await this.getAPIClient();

    if (schedule.recurring) {
      const { frequency, nextExecutionTime } = schedule.recurring;
      if (!_.isNumber(frequency) || frequency <= 0) {
        throw new Error("frequency must be a positive integer");
      }
      if (!_.isNumber(nextExecutionTime) || nextExecutionTime <= 0) {
        throw new Error("nextExecutionTime must be a positive integer");
      }
    } else {
      const { executionTimes } = schedule.fixed;
      if (!_.isArray(executionTimes)) {
        throw new Error("executionTimes is not an array");
      } 
      if (_.isEmpty(executionTimes)) {
        throw new Error("executionTimes is empty");
      } 
    }

    if (_.isNil(call)) {
      throw new Error("call is null or undefined");
    }

    const extrinsic = polkadotApi.tx['automationTime']['scheduleDynamicDispatchTask'](schedule, call)
    const signedExtrinsic = await extrinsic.signAsync(address, {
      signer,
      nonce: -1,
    })
    return signedExtrinsic.toHex()
  }

  /**
   * BuildCancelTaskExtrinsic: builds extrinsic as a hex string for cancelling a task.
   * User must provide txHash for the task and wallet address used to schedule the task.
   * @param address
   * @param taskID
   * @returns extrinsic hex, format: `0x${string}`
   */
  async buildCancelTaskExtrinsic(address: AddressOrPair, taskID: string, signer?: Signer): Promise<HexString> {
    const polkadotApi = await this.getAPIClient();
    const extrinsic = polkadotApi.tx['automationTime']['cancelTask'](taskID);
    const signedExtrinsic = await extrinsic.signAsync(address, { signer, nonce: -1});
    return signedExtrinsic.toHex();
  }

  /**
   * Gets Last Time Slots for AutomationTime pallet on chain
   * @returns (number, number)
   */
   async getAutomationTimeLastTimeSlot(): Promise<number[]> {
    const polkadotApi = await this.getAPIClient()
    const resultCodec = await polkadotApi.query['automationTime']['lastTimeSlot']()
    return resultCodec.toJSON() as number[]
  }

  /**
   * Gets Task hashes in Missed Queue. Missed Queue holds tasks that were not able
   * to be run during their scheduled time slot and will no longer run.
   * Tasks on the missed queue will be processed and an event will be emitted, marking
   * completion of the task.
   * @returns { task_id: 0xstring, execution_time: number }[]
   */
  async getAutomationTimeMissedQueue(): Promise<MissedTask[][]> {
    const polkadotApi = await this.getAPIClient()
    const resultCodec = await polkadotApi.query['automationTime']['missedQueueV2']()
    return resultCodec.toJSON() as unknown as MissedTask[][]
  }

  /**
   * Gets Task hashes in Task Queue. These are tasks that will be run in a time slot.
   * Current time slots are only in hours.
   * @returns 0xstring[]
   */
  async getAutomationTimeTaskQueue(): Promise<string[][]> {
    const polkadotApi = await this.getAPIClient()
    const resultCodec = await polkadotApi.query['automationTime']['taskQueueV2']()
    return resultCodec.toJSON() as string[][]
  }

  /**
   * Gets list of Task hashes for a given future time slot. These are the hashes for tasks
   * scheduled in future time slots, which are defined by the beginning of each hour.
   * @param inputTime
   * @returns 0xstring[]
   */
  async getAutomationTimeScheduledTasks(inputTime: number): Promise<string[][]> {
    const polkadotApi = await this.getAPIClient()
    const resultCodec = await polkadotApi.query['automationTime']['scheduledTasksV3'](inputTime)
    const tasksAfterCanceled = resultCodec.toJSON() as { tasks: string[][] }
    const tasks = tasksAfterCanceled ? tasksAfterCanceled.tasks : []
    return tasks
  }

  /**
   * Gets an Automation Task given a task ID. This will have all data and metadata
   * regarding each task.
   * @param taskID
   * @returns AutomationTask
   */
  async getAutomationTimeTasks(accountID: string, taskID: HexString): Promise<AutomationTask> {
    const polkadotApi = await this.getAPIClient()
    const resultCodec = await polkadotApi.query['automationTime']['accountTasks'](accountID, taskID)
    return resultCodec.toJSON() as unknown as AutomationTask
  }
}
