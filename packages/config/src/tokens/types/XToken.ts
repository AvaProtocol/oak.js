/**
 * The xTokens that are equiped with additional XCM attributes and meant for cross-chain transfer.
 */
import { Token, TokenConstructorParams } from "./Token"; // Ensure this path is correct.

interface XTokenConstructorParams {
  asset: TokenConstructorParams; // The 'asset' property is introduced here.
  id?: string;
  isNative: boolean;
  contractAddress?: string;
  otherSymbol?: string;
  unitPerSecond?: number;
  existentialDeposit?: number;
}

class XToken extends Token {
  public id: string | undefined;

  public isNative: boolean;

  public contractAddress?: string;

  public otherSymbol?: string;

  public unitPerSecond?: number;

  public existentialDeposit?: number;

  constructor(params: XTokenConstructorParams) {
    // Spreading 'asset' properties here so that they are passed as individual parameters to the super constructor.
    super({ ...params.asset });

    this.id = params.id;
    this.isNative = params.isNative;
    this.contractAddress = params.contractAddress;
    this.otherSymbol = params.otherSymbol;
    this.unitPerSecond = params.unitPerSecond;
    this.existentialDeposit = params.existentialDeposit;
  }
}

export { XToken };

export type { TokenConstructorParams };
