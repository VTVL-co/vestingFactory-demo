import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Web3ReactProvider } from '@web3-react/core';
import Header from './components/Header';
import Homepage from './pages/Homepage';
import { getLibrary } from './functions/fetch';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
	useEffect(() => {
		sessionStorage.setItem('vault', '');
	}, []);
	return (
		<Web3ReactProvider getLibrary={getLibrary}>
			<div className="App">
				<Header />

				<div className="content">
					<Routes>
						<Route
							exact
							path="/"
							element={<Homepage />}
						/>
					</Routes>
				</div>
				<ToastContainer />
			</div>
		</Web3ReactProvider>
	);
}

export default App;
