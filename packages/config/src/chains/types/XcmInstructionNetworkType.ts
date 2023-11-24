/**
 * Enum for XcmInstructionNetworkType
 * It is used to distinguish the network type of XCM instructions
 * {"descendOrigin":{"x1":{"accountId32":{"network":null,"id":"0xf04b83222206eb154a2851ae05499bc2a86dd8395d0a1cd78ee8bb699c6ded21"}}}}
 * Null: No network type, { network: null }
 * Concrete: Concrete network type, { network: "kusama" }
 */
export enum XcmInstructionNetworkType {
  Null,
  Concrete,
}
