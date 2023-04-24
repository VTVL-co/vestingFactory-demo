import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Contract } from '@ethersproject/contracts';
import VestingFactoryABI from '../constants/VestingFactoryABI.json';
import ERC20ABI from '../constants/MockERC20ABI.json';
import { ethers } from 'ethers';
import { parseEther } from '@ethersproject/units';
import { VESTING_FACTORY } from '../constants';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const iface = new ethers.utils.Interface(VestingFactoryABI.abi);

function getParamFromEvent(transaction, eventName, paramIndex) {
	const logs = transaction.logs.filter((l) =>
		l.topics.includes(
			'0xe5211516932e9042c46c90d9b551b41d1e991bc87e19bd664dc7b48f5323eef1'
		)
	);
	console.log({ logs });
	const event = iface.parseLog(logs[0]);
	return event.args[paramIndex];
}

// function getPredictAddress(factoryAddress, salt, bytecode) {
// 	const create2Inputs = ['0xff', factoryAddress, salt, keccak256(bytecode)];
// 	const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join('')}`;
// 	return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`);
// }

const Homepage = () => {
	const { library } = useWeb3React();
	const [fundAddress, setFundAddress] = useState('');
	const [vestingAddress, setVestingAddress] = useState('');
	const [schedule, setSchedule] = useState({
		linearAmount: '100',
		cliffAmount: '1'
	});
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (sessionStorage.getItem('vault')) {
			setVestingAddress(sessionStorage.getItem('vault'));
		}
	}, []);

	const onInputChange = (e) => {
		const { name, value } = e.target;

		setSchedule({
			...schedule,
			[name]: value
		});
	};

	const createSchedule = async () => {
		if (!library) return;
		if (!schedule.recipient) {
			alert('Input recipient address');
			return;
		}
		if (!schedule.linearAmount) {
			alert('Input Linear amount');
			return;
		}
		const fundTokenInstance = new Contract(
			fundAddress,
			ERC20ABI,
			library.getSigner()
		);
		// const nonce = await library.getTransactionCount(account);
		// const salt = keccak256(
		// 	solidityPack(['address', 'uint256'], [schedule.recipient, nonce])
		// );

		const tx = await fundTokenInstance.approve(
			VESTING_FACTORY,
			parseEther(
				(
					Number(schedule.linearAmount) + Number(schedule.cliffAmount)
				).toString()
			)
		);
		await tx.wait();
		const factoryInstance = new Contract(
			VESTING_FACTORY,
			VestingFactoryABI.abi,
			library.getSigner()
		);

		const startTime = Math.floor(schedule.startDate.getTime() / 1000);
		const endTime = Math.floor(schedule.endDate.getTime() / 1000);
		const releaseInterval = Math.floor(
			(endTime - startTime) / schedule.releaseFrequency
		);
		try {
			setIsLoading(true);

			const trx = await factoryInstance.createVestingContract(
				fundAddress,
				parseEther(
					(
						Number(schedule.linearAmount) + Number(schedule.cliffAmount)
					).toString()
				),
				schedule.recipient,
				[
					startTime,
					endTime,
					3600 * 24 * 30,
					releaseInterval,
					parseEther(schedule.linearAmount),
					parseEther(schedule.cliffAmount)
				]
			);
			const address = getParamFromEvent(
				await trx.wait(),
				'CreateVestingContract(address,uint256,[uint40,uint40,uint40,uint40,uint256,uint112])',
				0
			);
			console.log({ address });

			setVestingAddress(address);
			sessionStorage.setItem('vault', address);
			alert('You created the schedule successfully');
		} catch (err) {
			alert(err.message);
		}
		setIsLoading(false);
	};
	return (
		<div>
			<div style={{ marginLeft: '160px', marginBottom: '30px' }}>
				{isLoading && <div className="loading-spinner"></div>}
			</div>

			<div>
				<p>Vesting Address: {vestingAddress}</p>
				<div>
					<div className="flex">
						<span>Recipient: </span>
						<input
							type="text"
							name="recipient"
							value={schedule.recipient}
							placeholder="Recipient Address"
							onChange={(e) => onInputChange(e)}
						></input>
					</div>
					<div className="flex">
						<span>Fund token address: </span>
						<input
							placeholder="Fund token address"
							className="wallet_input"
							disabled={isLoading}
							value={fundAddress}
							onChange={(e) => setFundAddress(e.target.value)}
						/>
					</div>
					<div className="flex">
						<span>Start date: </span>
						<DatePicker
							selected={schedule.startDate}
							onChange={(date) => setSchedule({ ...schedule, startDate: date })}
						/>
					</div>
					<div className="flex">
						<span>End date: </span>
						<DatePicker
							selected={schedule.endDate}
							onChange={(date) => setSchedule({ ...schedule, endDate: date })}
						/>
					</div>

					<div className="flex">
						<span>cliffReleaseTimestamp: </span>
						<span>1 month</span>
					</div>

					<div className="flex">
						<span>Release frequency: </span>
						<input
							type="number"
							name="releaseFrequency"
							value={schedule.releaseFrequency}
							onChange={(e) => onInputChange(e)}
						></input>
					</div>

					<div className="flex">
						<span>Linear Vesting amount: </span>
						<input
							type="number"
							name="linearAmount"
							value={schedule.linearAmount}
							defaultValue={0}
							onChange={(e) => onInputChange(e)}
						></input>
					</div>

					<div className="flex">
						<span>Cliff Amount: </span>
						<input
							type="number"
							name="cliffAmount"
							defaultValue={0}
							value={schedule.cliffAmount}
							onChange={(e) => onInputChange(e)}
						></input>
					</div>
				</div>
				<div>
					Required fund:{' '}
					{Number(schedule.linearAmount) + Number(schedule.cliffAmount)}
				</div>
				{/* <button
					style={{ margin: '10px' }}
					onClick={(e) => fund()}
				>
					Fund
				</button> */}
				<br></br>
				<button onClick={(e) => createSchedule()}>Create Schedule</button>
			</div>
		</div>
	);
};

export default Homepage;
