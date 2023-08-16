export interface TransactInfo {
  encodedCall: Extrinsic,
  encodedCallWeight: Weight,
  overallWeight: Weight,
  fee: BN,
}
