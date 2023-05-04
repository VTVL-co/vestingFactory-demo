import { InjectedConnector } from '@web3-react/injected-connector';

export const injectedConnector = new InjectedConnector({
	supportedChainIds: [1, 5, 80001, 137, 42161, 421613, 43113, 84531]
});
