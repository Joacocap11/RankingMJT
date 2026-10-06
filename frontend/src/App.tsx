import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Nav from './Nav'
import RankingLayout from './RankingLayout'
import BeerRankingLayout from './BeerRankingLayout'

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Navigate to="/monsters" replace />} />
        <Route path="/monsters" element={<RankingLayout />} />
        <Route path="/beers" element={<BeerRankingLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
