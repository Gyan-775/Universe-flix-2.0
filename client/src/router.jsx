import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const RouterContext = createContext('/')

export function BrowserRouter({ children }) {
  const [location, setLocation] = useState(window.location.pathname + window.location.search)

  useEffect(() => {
    const onPopState = () => setLocation(window.location.pathname + window.location.search)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return <RouterContext.Provider value={location}>{children}</RouterContext.Provider>
}

export function Link({ to, children, ...props }) {
  function navigate(event) {
    if (to.startsWith('#') || props.target === '_blank') return
    event.preventDefault()
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return <a href={to} onClick={navigate} {...props}>{children}</a>
}

export function Routes({ children }) {
  const location = useContext(RouterContext).split('?')[0]
  const routes = Array.isArray(children) ? children : [children]
  const matches = (pattern) => {
    if (pattern === '*') return true
    const expected = pattern.split('/').filter(Boolean)
    const actual = location.split('/').filter(Boolean)
    return expected.length === actual.length && expected.every((segment, index) => segment.startsWith(':') || segment === actual[index])
  }
  const match = routes.find((route) => matches(route.props.path))
  if (!match) return null
  return match.props.element
}

export function Route() { return null }

export function useParams() {
  const path = useContext(RouterContext).split('?')[0]
  const segments = path.split('/').filter(Boolean)
  return useMemo(() => ({ id: segments[1] || null }), [path])
}
