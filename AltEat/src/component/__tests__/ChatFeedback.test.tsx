import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatFeedback from '../ChatFeedback'

const { insertMock, fromMock } = vi.hoisted(() => {
  const insert = vi.fn()
  const from = vi.fn(() => ({ insert }))
  return { insertMock: insert, fromMock: from }
})

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

describe('ChatFeedback', () => {
  beforeEach(() => {
    insertMock.mockReset()
    fromMock.mockClear()
  })

  it('renders the question and action buttons', () => {
    render(<ChatFeedback messageId="msg-1" sessionId="session-1" />)

    expect(screen.getByText('Was this helpful?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /comment/i })).toBeInTheDocument()
  })

  it('submits positive feedback and shows thank you message', async () => {
    insertMock.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(<ChatFeedback messageId="msg-2" sessionId="session-2" />)

    await user.click(screen.getByRole('button', { name: /yes/i }))

    expect(fromMock).toHaveBeenCalledWith('chat_feedback')
    expect(insertMock).toHaveBeenCalledWith({
      message_id: 'msg-2',
      session_id: 'session-2',
      is_helpful: true,
      comment: null,
    })

    expect(await screen.findByText(/thank you for your feedback/i)).toBeInTheDocument()
  })

  it('submits comment feedback after selecting a choice', async () => {
    insertMock.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(<ChatFeedback messageId="msg-3" sessionId="session-3" />)

    await user.click(screen.getByRole('button', { name: /comment/i }))
    await user.click(screen.getByRole('button', { name: /no/i }))
    await user.type(screen.getByPlaceholderText('Tell us more...'), 'Not accurate')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(insertMock).toHaveBeenCalledWith({
      message_id: 'msg-3',
      session_id: 'session-3',
      is_helpful: false,
      comment: 'Not accurate',
    })

    expect(await screen.findByText(/thank you for your feedback/i)).toBeInTheDocument()
  })
})
