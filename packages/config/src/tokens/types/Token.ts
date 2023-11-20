/**
 * This file defines the original Tokens
 */
interface Location {
	parents: number;
	interior: Record<string, unknown>;
}

interface TokenConstructorParams {
	key: string;
	symbol: string;
	decimals: number;
	location: any;
	network: string;
}

class Token {
    public key: string;
    public symbol: string;
    public decimals: number;
    public location: any; // Consider using a more specific type.
    public network: string;
  
    constructor(params: TokenConstructorParams) {
      this.key = params.key;
      this.symbol = params.symbol;
      this.decimals = params.decimals;
      this.location = params.location;
      this.network = params.network;
    }
  }

  /** Below defines createToken for simple creation of Token */
interface TokenParams {
	key: string;
	symbol: string;
	decimals: number;
	network: string;
	parachainId: number;
	palletInstance?: number;
}

// Function to construct the 'location' object based on the parameters.
function constructLocation(parachainId: number, palletInstance?: number): Location {
	let interior = palletInstance ? { X2: [{ Parachain: parachainId }, { PalletInstance: palletInstance }] } : { X1: { Parachain: parachainId } };

	return {
		parents: 1,
		interior,
	};
}

// Simplify the asset creation function.
function createToken(params: TokenParams): Token {
	const { key, symbol, decimals, network, parachainId, palletInstance } = params;
	const location = constructLocation(parachainId, palletInstance);

	return new Token({key, symbol, decimals, location, network});
}

export { createToken, Token, TokenConstructorParams };
