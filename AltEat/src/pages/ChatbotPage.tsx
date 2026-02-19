import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ChatFeedback from "../component/ChatFeedback";
import type { User } from "@supabase/supabase-js";
import Navbar from "../component/Navbar";
import { MoreVertical, Edit2, Trash2, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import RecipeCarousel from "../component/RecipeCarousel";
import { useProfile } from "../context/ProfileContext";
import IngredientCarousel from "../component/IngredientCarousel";
import type { IngredientDetail } from "../component/IngredientDetailPopup";

interface Recipe {
  name: string;
  id: number;
  image: string;
  ingredients?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text?: string;
  recipes?: Recipe[];
  ingredients?: IngredientDetail[];
  type: "text" | "recipes" | "ingredients";
}

interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
}

const N8N_WEBHOOK_URL =
  "http://localhost:5678/webhook/f1725c42-d6af-4b84-adba-86fb367f9f3b/chat";

function ChatbotPage() {
  const { t } = useTranslation("chatbot");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const { profile } = useProfile();
  const isLoggedIn = !!profile;

  const generateId = () =>
    Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const toggleMenu = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === sessionId ? null : sessionId);
  };

  const handleRenameClick = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.session_id);
    setEditTitle(session.title);
    setMenuOpenId(null);
  };

  const handleRenameSubmit = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!editingSessionId || !editTitle.trim()) return;

    const { error } = await supabase
      .from("chat_sessions")
      .update({ title: editTitle.trim() })
      .eq("session_id", editingSessionId);

    if (!error) {
      setSessions(
        sessions.map((s) =>
          s.session_id === editingSessionId
            ? { ...s, title: editTitle.trim() }
            : s,
        ),
      );
      setEditingSessionId(null);
      setEditTitle("");
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeleteConfirmationId(sessionId);
    setMenuOpenId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmationId) return;

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("session_id", deleteConfirmationId);

    if (!error) {
      setSessions(
        sessions.filter((s) => s.session_id !== deleteConfirmationId),
      );
      if (currentSessionId === deleteConfirmationId) {
        handleNewChat();
      }
      setDeleteConfirmationId(null);
    }
  };

  const renderMessageText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleOutsideClick = () => setMenuOpenId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setAuthLoading(false);
      } else {
        // Preserve the message parameter when redirecting to login
        const message = searchParams.get("message");
        if (message) {
          navigate(
            `/login?redirect=/chatbot&message=${encodeURIComponent(message)}`,
            { state: { warning: "You need to log in to access the chatbot." } },
          );
        } else {
          navigate("/login?redirect=/chatbot", {
            state: { warning: "You need to log in to access the chatbot." },
          });
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setAuthLoading(false);
      } else {
        const message = searchParams.get("message");
        if (message) {
          navigate(
            `/login?redirect=/chatbot&message=${encodeURIComponent(message)}`,
            { state: { warning: "You need to log in to access the chatbot." } },
          );
        } else {
          navigate("/login?redirect=/chatbot", {
            state: { warning: "You need to log in to access the chatbot." },
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  // Load sessions when user is authenticated
  useEffect(() => {
    if (user && !authLoading && !initialMessageSent) {
      const initialMessage = searchParams.get("message");
      if (initialMessage) {
        // Set the message and trigger send
        setInput(initialMessage);
        setInitialMessageSent(true);
        // Remove the message parameter from URL
        searchParams.delete("message");
        setSearchParams(searchParams);
        handleSend(initialMessage);
      } else {
        loadSessions();
      }
    }
  }, [user, authLoading, initialMessageSent, searchParams]);

  const loadSessions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSessions(data);
    }
  };

  const loadMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(
        data.map((msg) => {
          // Try to parse message_text as JSON to check if it's recipes
          try {
            const parsed = JSON.parse(msg.message_text);
            if (Array.isArray(parsed) && parsed[0]?.recipes) {
              return {
                id: msg.message_id,
                role: msg.sender_type as "user" | "bot",
                recipes: parsed[0].recipes,
                type: "recipes" as const,
              };
            }
            if (parsed && parsed.recipes && Array.isArray(parsed.recipes)) {
              return {
                id: msg.message_id,
                role: msg.sender_type as "user" | "bot",
                recipes: parsed.recipes,
                type: "recipes" as const,
              };
            }
            // Check for ingredients
            if (parsed && parsed.ingredients && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0 && typeof parsed.ingredients[0] === 'object') {
              return {
                id: msg.message_id,
                role: msg.sender_type as "user" | "bot",
                ingredients: parsed.ingredients,
                type: "ingredients" as const,
              };
            }
          } catch {
            // Not JSON or not recipes format, treat as text
          }

          return {
            id: msg.message_id,
            role: msg.sender_type as "user" | "bot",
            text: msg.message_text,
            type: "text" as const,
          };
        }),
      );
    }
  };

  const createNewSession = async (firstMessage: string) => {
    if (!user) return null;

    const sessionId = generateId();
    const title =
      firstMessage.length > 30
        ? firstMessage.substring(0, 30) + "..."
        : firstMessage;

    const { error } = await supabase.from("chat_sessions").insert({
      session_id: sessionId,
      user_id: user.id,
      title: title,
    });

    if (!error) {
      setCurrentSessionId(sessionId);
      await loadSessions();
      return sessionId;
    }
    return null;
  };

  const saveMessage = async (
    sessionId: string,
    messageId: string,
    senderType: "user" | "bot",
    messageText: string,
  ) => {
    await supabase.from("chat_messages").insert({
      message_id: messageId,
      session_id: sessionId,
      sender_type: senderType,
      message_text: messageText,
    });
  };

  const handleSend = async (messageOverride?: string) => {
    const text = typeof messageOverride === "string" ? messageOverride : input;
    if (!text.trim() || isLoading || !user) return;

    const userMessage = text.trim();
    const userMessageId = generateId();
    setInput("");
    setIsLoading(true);

    // Create new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession(userMessage);
      if (!sessionId) {
        setIsLoading(false);
        return;
      }
    }

    // Add user message to UI
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: "user",
      text: userMessage,
      type: "text",
    };
    setMessages((prev) => [...prev, userMsg]);

    // Save user message to Supabase
    await saveMessage(sessionId, userMessageId, "user", userMessage);

    try {
      // Send to n8n webhook
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: userMessage,
          sessionId: sessionId,
          messageId: userMessageId,
          userId: user.id,
        }),
      });

      console.log("Response from n8n:", res);
      let data = (await res.json());
      if(data.data){
        data = data.data;
      }
      console.log("Parsed data:", data);

      // Check if response is recipes format
      let botMessage: ChatMessage;
      let messageTextToSave: string;

      const recipesData =
        Array.isArray(data) && data[0]?.recipes
          ? data[0].recipes
          : data?.recipes && Array.isArray(data.recipes)
            ? data.recipes
            : null;

      const ingredientsList = data.ingredients && Array.isArray(data.ingredients) && typeof data.ingredients[0] === 'string' 
        ? data.ingredients 
        : null;

      if (recipesData) {
        // Recipe carousel format
        const botMessageId = generateId();
        botMessage = {
          id: botMessageId,
          role: "bot",
          recipes: recipesData,
          type: "recipes",
        };
        messageTextToSave = JSON.stringify(data); // Save as JSON string
      } else if (ingredientsList) {
        // Fetch ingredient details
        const { data: ingredientsDetails, error: ingError } = await supabase
          .from('ingredients')
          .select('*')
          .in('ingredient_name', ingredientsList);

        if (!ingError && ingredientsDetails && ingredientsDetails.length > 0) {
          const botMessageId = generateId();
          botMessage = {
            id: botMessageId,
            role: "bot",
            ingredients: ingredientsDetails,
            type: "ingredients",
          };
          messageTextToSave = JSON.stringify({ ingredients: ingredientsDetails });
        } else {
          // Fallback if not found
          const botResponse = "I found these ingredients: " + ingredientsList.join(", ");
          botMessage = {
            id: generateId(),
            role: "bot",
            text: botResponse,
            type: "text",
          };
          messageTextToSave = botResponse;
        }
      } else {
        // Text format
        let botResponse = "";
        if (data.output) {
          botResponse = data.output;
        } else if (data.text) {
          botResponse = data.text;
        } else if (typeof data === "string") {
          botResponse = data;
        } else {
          botResponse = JSON.stringify(data, null, 2);
        }

        const botMessageId = generateId();
        botMessage = {
          id: botMessageId,
          role: "bot",
          text: botResponse,
          type: "text",
        };
        messageTextToSave = botResponse;
      }

      setMessages((prev) => [...prev, botMessage]);

      // Save bot message to Supabase
      await saveMessage(sessionId, botMessage.id, "bot", messageTextToSave);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessageId = generateId();
      const errorMsg: ChatMessage = {
        id: errorMessageId,
        role: "bot",
        text: t("error.processing"),
        type: "text",
      };
      setMessages((prev) => [...prev, errorMsg]);
      await saveMessage(sessionId, errorMessageId, "bot", errorMsg.text!);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const handleSessionClick = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#FFCB69] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/src/assets/chatbot-bg.png')",
      }}
    >
      <Navbar />
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r transition-all duration-300 flex flex-col ${isSidebarOpen ? "w-64" : "w-14"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-3">
            {isSidebarOpen && (
              <span className="text-sm font-semibold">{t("history")}</span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#FFCB69] transition"
            >
              {isSidebarOpen ? "⟨" : "⟩"}
            </button>
          </div>

          {isSidebarOpen && (
            <div className="px-3 pb-2">
              <button
                onClick={handleNewChat}
                className="w-full py-2 px-3 bg-[#FFCB69] rounded-md text-sm font-medium hover:bg-[#e6b85e] transition"
              >
                {t("newChat")}
              </button>
            </div>
          )}

          <div className="border-t border-gray-300"></div>

          {isSidebarOpen && (
            <ul className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm text-gray-600">
              {sessions.map((session) => (
                <li
                  key={session.session_id}
                  onClick={() =>
                    editingSessionId !== session.session_id &&
                    handleSessionClick(session.session_id)
                  }
                  className={`rounded-md px-2 py-1.5 cursor-pointer transition-colors duration-200 relative ${
                    currentSessionId === session.session_id
                      ? "bg-[#FFCB69]"
                      : "hover:bg-[#FFCB69]/50"
                  }`}
                >
                  {editingSessionId === session.session_id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 min-w-0 bg-white border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-[#FFCB69]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit();
                          if (e.key === "Escape") setEditingSessionId(null);
                        }}
                      />
                      <button
                        onClick={() => handleRenameSubmit()}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingSessionId(null)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1">{session.title}</span>
                      <div className="relative">
                        <button
                          onClick={(e) => toggleMenu(e, session.session_id)}
                          className={`p-1 rounded-full hover:bg-black/10 transition-opacity`}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {menuOpenId === session.session_id && (
                          <div className="absolute right-0 top-6 z-20 w-32 bg-white rounded-md shadow-lg border border-gray-100 py-1 overflow-hidden">
                            <button
                              onClick={(e) => handleRenameClick(e, session)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Edit2 size={12} /> {t("actions.rename")}
                            </button>
                            <button
                              onClick={(e) =>
                                handleDeleteClick(e, session.session_id)
                              }
                              className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 size={12} /> {t("actions.delete")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {sessions.length === 0 && (
                <li className="text-gray-400 text-center py-4">
                  {t("noHistory")}
                </li>
              )}
            </ul>
          )}
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl h-full max-h-[90vh] bg-white rounded-3xl shadow-xl flex flex-col p-6">
            {/* Welcome Card - show only when no messages */}
            {messages.length === 0 && (
              <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                <h1 className="font-semibold text-lg mb-1">
                  {t("greeting.title")}
                </h1>
                <p className="text-sm text-gray-600 mb-4">
                  {t("greeting.subtitle")}
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    t("greeting.suggestions.milk"),
                    t("greeting.suggestions.soySauce"),
                    t("greeting.suggestions.egg"),
                    t("greeting.suggestions.sugar"),
                  ].map((text, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(text)}
                      className="px-3 py-1.5 bg-yellow-200 text-sm rounded-full hover:bg-[#FFCB69] transition"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "bot" && (
                    <div className="flex-shrink-0">
                      <div className="w-9 h-9 bg-[#FBB496] rounded-full flex items-center justify-center text-sm text-[#562C0C]">
                        B
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] ${
                      msg.role === "user"
                        ? "flex flex-col items-end"
                        : "flex flex-col items-start"
                    }`}
                  >
                    {msg.type === "recipes" && msg.recipes ? (
                      // Recipe Carousel Format
                      <div className="w-full">
                        <RecipeCarousel recipes={msg.recipes} />
                      </div>
                    ) : msg.type === "ingredients" && msg.ingredients ? (
                      <div className="w-full">
                        <IngredientCarousel ingredients={msg.ingredients} />
                      </div>
                    ) : (
                      // Text Format
                      <div
                        className={`px-4 py-2 rounded-2xl text-sm ${
                          msg.role === "user"
                            ? "bg-[#FFCB69] rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">
                          {renderMessageText(msg.text || "")}
                        </p>
                      </div>
                    )}

                    {msg.role === "bot" && currentSessionId && (
                      <ChatFeedback
                        messageId={msg.id}
                        sessionId={currentSessionId}
                      />
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0">
                      {isLoggedIn && profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url || "/placeholder.svg"}
                          alt="Profile"
                          className="h-9 w-9 rounded-full object-cover border-2 border-[#e48f75]"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm">
                          U
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 bg-[#FBB496] rounded-full flex items-center justify-center text-sm text-[#562C0C]">
                      B
                    </div>
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}  
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="mt-4">
              <div className="flex items-center border rounded-full px-4 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={t("input.placeholder")}
                  className="flex-1 outline-none text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="ml-2 w-8 h-8 bg-[#FFCB69] rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl transform transition-all">
            <h3 className="text-lg font-semibold mb-2">{t("delete.title")}</h3>
            <p className="text-gray-600 text-sm mb-6">{t("delete.message")}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t("delete.cancel")}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                {t("delete.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatbotPage;
