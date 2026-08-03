import Header from '../components/layout/Header.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'

function AppLayout({ children, headerProps, sidebarProps }) {
	return (
		<div className="app-shell">
			<Sidebar {...sidebarProps} />
			<div className="content">
				<Header {...headerProps} />
				<main className="layout-main">{children}</main>
			</div>
		</div>
	)
}

export default AppLayout
