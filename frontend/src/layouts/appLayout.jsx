import Header from '../components/layout/Header.jsx'

function AppLayout({ children, headerProps }) {
	return (
		<div className="content">
			<Header {...headerProps} />
			{children}
		</div>
	)
}

export default AppLayout
