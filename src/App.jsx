import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './components/Home.jsx'
import SectionCard from './components/SectionCard.jsx'
import { sections } from './content/site.js'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        {sections.map((section) => (
          <Route
            key={section.slug}
            path={section.slug}
            element={<SectionCard section={section} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
