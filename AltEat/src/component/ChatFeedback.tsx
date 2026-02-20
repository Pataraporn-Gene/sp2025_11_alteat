import { useState } from "react"
import { supabase } from "../lib/supabase"

interface ChatFeedbackProps {
  messageId: string
  sessionId: string
}

function ChatFeedback({ messageId, sessionId }: ChatFeedbackProps) {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const submitFeedback = async (feedbackType: "positive" | "negative", commentText = "") => {
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("chat_feedback").insert({
        message_id: messageId,
        session_id: sessionId,
        is_helpful: feedbackType === "positive",
        comment: commentText || null,
      })

      if (!error) {
        setIsSubmitted(true)
      } else {
        console.error("Failed to submit feedback:", error)
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFeedbackClick = async (type: "positive" | "negative") => {
    if (isSubmitted) return
    setFeedback(type)
    if (!showComment) {
      await submitFeedback(type)
    }
  }

  const handleCommentSubmit = async () => {
    if (feedback) {
      await submitFeedback(feedback, comment)
      setShowComment(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg mt-2">
        <span>✓ Thank you for your feedback!</span>
      </div>
    )
  }

  return (
  <div className="mt-3 p-2 bg-gray-50 rounded-lg border">
    <div className="flex flex-wrap items-center gap-2 mb-2"> {/* added flex-wrap */}
      <span className="text-xs text-gray-600">Was this helpful?</span>

      <button
        onClick={() => handleFeedbackClick("positive")}
        disabled={isSubmitting}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
          feedback === "positive"
            ? "bg-green-100 text-green-700"
            : "bg-white hover:bg-green-50 text-gray-600 hover:text-green-600"
        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        👍 <span>Yes</span>
      </button>

      <button
        onClick={() => handleFeedbackClick("negative")}
        disabled={isSubmitting}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
          feedback === "negative"
            ? "bg-red-100 text-red-700"
            : "bg-white hover:bg-red-50 text-gray-600 hover:text-red-600"
        } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        👎 <span>No</span>
      </button>

      <button
        onClick={() => setShowComment(!showComment)}
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors text-xs"
      >
        💬 <span>Comment</span>
      </button>
    </div>

    {showComment && (
      <div className="flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more..."
          className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#FFCB69]"
        />
        <button
          onClick={handleCommentSubmit}
          className="px-2 py-1 bg-[#FFCB69] text-gray-800 rounded-md hover:bg-[#e6b85e] transition-colors text-xs shrink-0"
        >
          Send
        </button>
      </div>
    )}

    {isSubmitting && <div className="text-xs text-gray-500 mt-1">Submitting...</div>}
  </div>
)
}

export default ChatFeedback
