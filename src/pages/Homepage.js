import { useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { toast } from 'react-toastify';

const Homepage = () => {
	const { library, account } = useWeb3React();
	const [message, setMessage] = useState('');

	const onSign = async () => {
		if (!message) {
			toast.error('Please input the message');
			return;
		}
		await library.provider.request({
			method: 'personal_sign',
			params: [message, account],
			jsonrpc: '2.0'
		});
	};

	return (
		<div>
			<div className="body">
				<p>Your wallet address: {account}</p>
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

				<button onClick={(e) => onSign()}>Sign the message</button>
			</div>
		</div>
	);
};

export default Homepage;
