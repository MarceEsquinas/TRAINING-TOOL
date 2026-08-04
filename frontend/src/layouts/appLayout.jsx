import Header from '../components/layout/Header.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'
import PageContainer from '../components/layout/pageContainer.jsx'

function AppLayout({ children, headerProps, sidebarProps }) {
	return (
		<div className="app-shell">
			<Sidebar {...sidebarProps} />
			<div className="content">
				<Header {...headerProps} />
				<PageContainer>{children}</PageContainer>
			</div>
		</div>
	)
}

export default AppLayout
