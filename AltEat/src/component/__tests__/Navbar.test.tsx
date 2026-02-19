import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Navbar from '../Navbar'

const navigateMock = vi.hoisted(() => vi.fn())
const profileState = vi.hoisted(() => ({
  profile: null as { avatar_url?: string } | null,
}))

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  useNavigate: () => navigateMock,
}))

vi.mock('../../context/ProfileContext', () => ({
  useProfile: () => profileState,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../LanguageSwitcher', () => ({
  default: () => <div>language-switcher</div>,
}))

vi.mock('../../assets/logo.png', () => ({
  default: 'logo.png',
}))

describe('Navbar', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    profileState.profile = null
  })

  it('renders navigation links', () => {
    render(<Navbar />)

    expect(screen.getByText('aboutUs')).toBeInTheDocument()
    expect(screen.getByText('recipes')).toBeInTheDocument()
    expect(screen.getByText('ingredients')).toBeInTheDocument()
    expect(screen.getByText('chatbot')).toBeInTheDocument()
    expect(screen.getByText('language-switcher')).toBeInTheDocument()
  })

  it('navigates to login when user is not authenticated', async () => {
    const user = userEvent.setup()
    const { container } = render(<Navbar />)

    const userButton = container.querySelector('button[type="button"]')
    expect(userButton).toBeTruthy()

    await user.click(userButton as HTMLButtonElement)

    expect(navigateMock).toHaveBeenCalledWith('/login')
  })

  it('navigates to profile when user is authenticated', async () => {
    profileState.profile = { avatar_url: '/avatar.png' }
    const user = userEvent.setup()
    const { container } = render(<Navbar />)

    const userButton = container.querySelector('button[type="button"]')
    expect(screen.getByAltText('Profile')).toBeInTheDocument()

    await user.click(userButton as HTMLButtonElement)

    expect(navigateMock).toHaveBeenCalledWith('/profile')
  })
})
