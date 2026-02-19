import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LanguageSwitcher from '../LanguageSwitcher'

const i18nState = vi.hoisted(() => ({
  changeLanguage: vi.fn(),
  language: 'en',
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: i18nState,
  }),
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    i18nState.changeLanguage.mockReset()
    i18nState.language = 'en'
  })

  it('changes language when buttons are clicked', async () => {
    const user = userEvent.setup()

    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { name: 'TH' }))
    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(i18nState.changeLanguage).toHaveBeenCalledWith('th')
    expect(i18nState.changeLanguage).toHaveBeenCalledWith('en')
  })

  it('highlights the active language', () => {
    i18nState.language = 'th'

    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: 'TH' })).toHaveClass('font-bold')
    expect(screen.getByRole('button', { name: 'EN' })).not.toHaveClass('font-bold')
  })
})
