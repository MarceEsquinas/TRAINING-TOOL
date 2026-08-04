function pageContainer({ children }) {
  // Punto único de render del contenido activo dentro del layout.
  return (
    <main className="layout-main" role="main">
      {children}
    </main>
  )
}

export default pageContainer