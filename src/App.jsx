import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './components/Home.jsx'
import SectionView from './components/SectionView.jsx'
import { sections } from './content/site.js'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        {sections.map((section, i) => (
          <Route
            key={section.slug}
            path={section.slug}
            element={<SectionView section={section} index={i} total={sections.length} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
