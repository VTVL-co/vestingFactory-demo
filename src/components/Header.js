import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';

import '../assets/styles/header.css';
import { injectedConnector } from '../connectors';

const Header = () => {
	const { active, activate, account } = useWeb3React();

	useEffect(() => {
		if (!active) {
			activate(injectedConnector);
		}
	}, [active, activate]);

	return (
		<div className="header">
			<div>
				<Link
					to="/"
					className="logo"
				>
					VTVL
				</Link>
			</div>

			<div className="menu-container">
				<Link
					to="/"
					className="menu"
				>
					Create Vault
				</Link>

				<button
					className="btn_connect"
					onClick={() => {
						activate(injectedConnector);
					}}
				>
					{account ? 'Connected!' : 'Connect'}
				</button>
			</div>
		</div>
	);
};

export default Header;
