import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AboutUsPage from '../../pages/AboutUsPage'

vi.mock('../../component/Navbar.tsx', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock images
vi.mock('../../assets/team.jpg', () => ({ default: 'team.jpg' }))
vi.mock('../../assets/team1.jpg', () => ({ default: 'team1.jpg' }))
vi.mock('../../assets/team2.jpg', () => ({ default: 'team2.jpg' }))
vi.mock('../../assets/team3.jpg', () => ({ default: 'team3.jpg' }))

describe('AboutUsPage', () => {
  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <AboutUsPage />
      </MemoryRouter>
    )

    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByText('title')).toBeInTheDocument()
    
    // Overview
    expect(screen.getByText('overview.title')).toBeInTheDocument()
    expect(screen.getByText('overview.paragraph1')).toBeInTheDocument()
    expect(screen.getByText('overview.paragraph2')).toBeInTheDocument()
    expect(screen.getByAltText('Overview')).toBeInTheDocument()

    // Team section
    expect(screen.getByText('team.title')).toBeInTheDocument()
    expect(screen.getByAltText('Team Member 1')).toBeInTheDocument()
    expect(screen.getByText('team.members.member1')).toBeInTheDocument()
    expect(screen.getByAltText('Team Member 2')).toBeInTheDocument()
    expect(screen.getByText('team.members.member2')).toBeInTheDocument()
    expect(screen.getByAltText('Team Member 3')).toBeInTheDocument()
    expect(screen.getByText('team.members.member3')).toBeInTheDocument()
  })
})
