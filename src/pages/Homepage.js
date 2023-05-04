import { useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';

const Homepage = () => {
	const { library, account } = useWeb3React();
	const [message, setMessage] = useState('');
	const [address, setAddress] = useState('');
	const [signature, setSignature] = useState('');

	const onSign = async () => {
		if (!message) {
			toast.error('Please input the message');
			return;
		}

		if (!address) {
			toast.error('Please input the address');
			return;
		}
		const sig = await library.provider.request({
			method: 'personal_sign',
			params: [message, account],
			jsonrpc: '2.0'
		});

		setSignature(sig);
	};

	const onVerify = () => {
		const sig = ethers.utils.splitSignature(signature);
		const x = ethers.utils.verifyMessage(message, sig);

		if (!x || x.toLowerCase() !== address.toLowerCase()) {
			toast.error(`Invalid signature. You signed with ${x}`);
		} else {
			toast.success('Valid signature');
		}
	};

	return (
		<div>
			<div className="body">
				<div>
					<label for="address">Wallet address:</label>
					<input
						type="text"
						name="address"
						id="address"
						placeholder="Please input the wallet address that you want to verify"
						value={address}
						onChange={(e) => setAddress(e.target.value)}
					></input>
				</div>
				<div>
					<label for="message">Message:</label>
					<input
						type="text"
						name="message"
						id="message"
						placeholder="Please input the message that you are going to sign"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
					></input>
				</div>
				{signature && <div>Signature: {signature}</div>}
				<div className="buttons">
					<button onClick={(e) => onSign()}>Sign the message</button>
					<button onClick={(e) => onVerify()}>Verify the signature</button>
				</div>
			</div>
		</div>
	);
};

export default Homepage;
