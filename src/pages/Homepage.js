import { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Contract } from '@ethersproject/contracts';
import VestingFactoryABI from '../constants/VestingFactoryABI.json';
import VestingContractABI from '../constants/Vesting.json';
import ERC20ABI from '../constants/MockERC20ABI.json';
import { BigNumber, ethers } from 'ethers';
import { parseEther } from '@ethersproject/units';
import { VESTING_FACTORY } from '../constants';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const iface = new ethers.utils.Interface(VestingFactoryABI);

function getParamFromEvent(transaction, eventName, paramIndex) {
	const logs = transaction.logs.filter((l) =>
		l.topics.includes(ethers.utils.id(eventName))
	);
	const event = iface.parseLog(logs[0]);
	return event.args[paramIndex];
}

const Homepage = () => {
	const { library } = useWeb3React();
	const [fundAddress, setFundAddress] = useState(
		'0xFe1c5FE9B0e1441D8857d0576eA48CA077AbD098'
	);
	const [vestingAddress, setVestingAddress] = useState('');
	const [schedule, setSchedule] = useState({});
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (sessionStorage.getItem('vault')) {
			setVestingAddress(sessionStorage.getItem('vault'));
		}
	}, []);

	const createVestingContract = async () => {
		if (isLoading) return;
		if (!fundAddress) {
			alert('Please input Fund token address');
			return;
		}
		if (library) {
			const factoryInstance = new Contract(
				VESTING_FACTORY,
				VestingFactoryABI,
				library.getSigner()
			);
			if (ethers.utils.isAddress(fundAddress)) {
				setIsLoading(true);
				const transaction = await factoryInstance.createVestingContract(
					fundAddress
				);

				const address = getParamFromEvent(
					await transaction.wait(),
					'CreateVestingContract(address,address)',
					0
				);

				setVestingAddress(address);
				sessionStorage.setItem('vault', address);
				setIsLoading(false);
			} else {
				alert('Please input valid fundAddress address');
			}
		}
	};

	const onInputChange = (e) => {
		const { name, value } = e.target;

		setSchedule({
			...schedule,
			[name]: value
		});
	};

	const fund = async () => {
		if (!library) return;
		const fundTokenInstance = new Contract(
			fundAddress,
			ERC20ABI,
			library.getSigner()
		);
		try {
			setIsLoading(true);
			const trx = await fundTokenInstance.transfer(
				vestingAddress,
				parseEther(
					(
						Number(schedule.linearAmount) + Number(schedule.cliffAmount)
					).toString()
				)
			);
			await trx.wait();
			alert('You deposited successfully');
		} catch (err) {
			alert(err.message);
		}
		setIsLoading(false);
	};

	const createSchedule = async () => {
		if (!library) return;
		const fundTokenInstance = new Contract(
			fundAddress,
			ERC20ABI,
			library.getSigner()
		);
		const balance = await fundTokenInstance.balanceOf(vestingAddress);
		const requiredFund = BigNumber.from(schedule.linearAmount).add(
			schedule.cliffAmount
		);
		if (BigNumber.from(balance).sub(requiredFund).isNegative()) {
			alert('You need to fund tokens');
			return;
		}
		const vestingContractInstance = new Contract(
			vestingAddress,
			VestingContractABI,
			library.getSigner()
		);

		const startTime = Math.floor(schedule.startDate.getTime() / 1000);
		const endTime = Math.floor(schedule.endDate.getTime() / 1000);
		const releaseInterval = Math.floor(
			(endTime - startTime) / schedule.releaseFrequency
		);
		try {
			setIsLoading(true);
			const trx = await vestingContractInstance.createClaim(
				schedule.recipient,
				startTime,
				endTime,
				3600 * 24 * 30,
				releaseInterval,
				parseEther(schedule.linearAmount),
				parseEther(schedule.cliffAmount),
				schedule.fractionalAmount
			);
			await trx.wait();
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
			{!vestingAddress && (
				<div>
					<input
						placeholder="Fund token address"
						className="wallet_input"
						disabled={isLoading}
						value={fundAddress}
						onChange={(e) => setFundAddress(e.target.value)}
					/>
					<button onClick={(e) => createVestingContract()}>
						Create vesting contract
					</button>
				</div>
			)}

			{vestingAddress && (
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
							<span>Start date: </span>
							<DatePicker
								selected={schedule.startDate}
								onChange={(date) =>
									setSchedule({ ...schedule, startDate: date })
								}
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
								onChange={(e) => onInputChange(e)}
							></input>
						</div>

						<div className="flex">
							<span>Cliff Amount: </span>
							<input
								type="number"
								name="cliffAmount"
								value={schedule.cliffAmount}
								onChange={(e) => onInputChange(e)}
							></input>
						</div>

						<div className="flex">
							<span>Fractional amount: </span>
							<input
								type="number"
								name="fractionalAmount"
								value={schedule.fractionalAmount}
								onChange={(e) => onInputChange(e)}
							></input>
						</div>
					</div>
					<div>
						Required fund:{' '}
						{Number(schedule.linearAmount) + Number(schedule.cliffAmount)}
					</div>
					<button
						style={{ margin: '10px' }}
						onClick={(e) => fund()}
					>
						Fund
					</button>
					<button onClick={(e) => createSchedule()}>Create Schedule</button>
				</div>
			)}
		</div>
	);
};

export default Homepage;
