import { WsProvider, ApiPromise } from '@polkadot/api'
import { HexString } from '@polkadot/util/types'
import * as _ from 'lodash'

import { OakChainWebsockets } from './constants'

/**
 * The Observer class is for checking the state of the chain.
 * Currently, this will give visibility into:
 * - Last Time Slot
 * - Missed Task Queue
 * - Task Queue
 * - Scheduled Task Map
 * - Task Map
 *
 * The constructor takes the input to create an API client to connect to the blockchain.
 * Further commands are performed via this API client in order to reach the blockchain.
 * @param chain: OakChains ("STUR"/"TUR")
 */
export class Observer {
  wsProvider: WsProvider
  api: ApiPromise

  /**
   * constructor
   * @param chain 
   * @param options { providerUrl }, You can specify a custom provider url.
   */
  constructor(chain: OakChains, options: { providerUrl: string | undefined }) {
    const { providerUrl } = options || {};
    this.wsProvider = new WsProvider(providerUrl || OakChainWebsockets[chain])
  }

  private async getAPIClient(): Promise<ApiPromise> {
    if (_.isNil(this.api)) {
      this.api = await ApiPromise.create({ provider: this.wsProvider })
    }
    return this.api
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
