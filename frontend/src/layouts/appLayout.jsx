import Header from '../components/layout/Header.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'
import Main from '../components/layout/Main.jsx'

function AppLayout({ children, headerProps, sidebarProps }) {
	return (
		<div className="app-shell">
			<Sidebar {...sidebarProps} />
			<div className="content">
				<Header {...headerProps} />
				<Main>{children}</Main>
			</div>
		</div>
	)
}

export default AppLayout
