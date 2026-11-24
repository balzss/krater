import { Router, Route, Switch } from 'wouter'
import { LayoutProvider } from '@/contexts/layout-context'
import { BASE_PATH } from '@/lib/constants'
import HomePage from '@/pages/home'
import BrowsePage from '@/pages/browse'
import ArtistsPage from '@/pages/artists'
import RandomPage from '@/pages/random'
import CardPage from '@/pages/card'
import SettingsPage from '@/pages/settings'
import NotFoundPage from '@/pages/not-found'

export default function App() {
  return (
    <LayoutProvider>
      <Router base={BASE_PATH}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/browse" component={BrowsePage} />
          <Route path="/artists" component={ArtistsPage} />
          <Route path="/random" component={RandomPage} />
          <Route path="/card" component={CardPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </Router>
    </LayoutProvider>
  )
}
