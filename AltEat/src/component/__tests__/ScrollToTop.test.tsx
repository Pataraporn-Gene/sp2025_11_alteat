import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ScrollToTop from '../ScrollToTop'

const locationState = vi.hoisted(() => ({ pathname: '/start' }))

vi.mock('react-router-dom', () => ({
  useLocation: () => locationState,
}))

describe('ScrollToTop', () => {
  it('scrolls to top when pathname changes', () => {
    const scrollToMock = vi.fn()
    window.scrollTo = scrollToMock

    const { rerender } = render(<ScrollToTop />)

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    })

    locationState.pathname = '/next'
    rerender(<ScrollToTop />)

    expect(scrollToMock).toHaveBeenCalledTimes(2)
  })
})
