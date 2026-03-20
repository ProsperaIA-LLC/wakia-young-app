'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ProsperoChatProps {
  weekId: string
  cohortId: string
  userName?: string
}

const SUGGESTIONS = [
  '¿Cómo valido mi idea de negocio?',
  '¿Qué es un prototipo MVP?',
  'Ayúdame con mi entregable',
  '¿Cómo uso prompts efectivos?',
]

const CHIPS = ['Prototipo', 'Prompting', 'Validación', 'Entregable']

function formatTime(date: Date) {
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function ProsperoChat({ weekId, cohortId, userName }: ProsperoChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeChip, setActiveChip] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const showSuggestions = messages.length === 0

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const autoResize = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, weekId, cohortId }),
      })
      const data = await res.json()
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.ok ? data.reply : 'Lo siento, ocurrió un error. Intenta de nuevo.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMsg])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Lo siento, no pude conectarme. Verifica tu conexión.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, weekId, cohortId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleChip = (chip: string) => {
    setActiveChip(chip)
    sendMessage(`Necesito ayuda con: ${chip}`)
  }

  return (
    <>
      <style>{`
        @keyframes tp-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes tp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes tp-panel-in {
          from { opacity: 0; transform: scale(0.85) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes tp-panel-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.85) translateY(16px); }
        }
        .tp-dot-1 { animation: tp-bounce 1.2s infinite 0s; }
        .tp-dot-2 { animation: tp-bounce 1.2s infinite 0.2s; }
        .tp-dot-3 { animation: tp-bounce 1.2s infinite 0.4s; }
        .tp-pulse-dot { animation: tp-pulse 2s infinite; }
        .tp-panel-enter { animation: tp-panel-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .tp-scrollbar::-webkit-scrollbar { width: 4px; }
        .tp-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .tp-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

        .tp-fab {
          position: fixed; bottom: 28px; right: 28px;
          width: 60px; height: 60px;
        }
        .tp-panel {
          position: fixed;
          bottom: 102px; right: 28px;
          width: 388px; height: 570px;
        }
        @media (max-width: 768px) {
          .tp-fab { bottom: 80px; right: 16px; }
          .tp-panel {
            bottom: 148px;
            right: 16px;
            width: calc(100vw - 32px);
            max-width: 388px;
            height: min(520px, calc(100dvh - 220px));
          }
        }
      `}</style>

      {/* FAB */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Abrir tutor Próspero"
        className="tp-fab"
        style={{
          borderRadius: '50%',
          background: 'var(--magenta, #e91e8c)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          color: '#fff',
          boxShadow: '0 4px 20px rgba(233,30,140,0.45)',
          zIndex: 9998,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
      >
        <span style={{ lineHeight: 1 }}>✦</span>
        {/* Green pulse dot */}
        <span
          className="tp-pulse-dot"
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#4caf50',
            border: '2px solid #fff',
          }}
        />
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="tp-panel-enter tp-panel"
          style={{
            borderRadius: 20,
            background: '#1a1a2e',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            fontFamily: 'inherit',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'var(--navy, #0a0a1a)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              flexShrink: 0,
            }}
          >
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'var(--magenta, #e91e8c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                ✦
              </div>
              <span
                style={{
                  position: 'absolute',
                  bottom: 1,
                  right: 1,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#4caf50',
                  border: '2px solid #0a0a1a',
                }}
              />
            </div>

            {/* Name + status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                Próspero
              </div>
              <div style={{ color: '#4caf50', fontSize: 11, marginTop: 2 }}>
                ● En línea · IA Tutor
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: 8,
                color: '#aaa',
                cursor: 'pointer',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Chips */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: '10px 14px',
              overflowX: 'auto',
              flexShrink: 0,
              scrollbarWidth: 'none',
            }}
          >
            {CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => handleChip(chip)}
                style={{
                  background: activeChip === chip ? 'var(--magenta, #e91e8c)' : 'rgba(233,30,140,0.12)',
                  border: '1px solid var(--magenta, #e91e8c)',
                  borderRadius: 20,
                  color: activeChip === chip ? '#fff' : 'var(--magenta, #e91e8c)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div
            className="tp-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Welcome message */}
            {showSuggestions && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--magenta, #e91e8c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    color: '#fff',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  ✦
                </div>
                <div>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      borderRadius: '4px 16px 16px 16px',
                      padding: '10px 14px',
                      color: '#e0e0e0',
                      fontSize: 13,
                      lineHeight: 1.5,
                      maxWidth: 280,
                    }}
                  >
                    ¡Hola{userName ? `, ${userName}` : ''}! Soy Próspero, tu tutor de IA. ¿En qué te puedo ayudar hoy?
                  </div>
                  <div style={{ color: '#555', fontSize: 10, marginTop: 4, marginLeft: 4 }}>
                    {formatTime(new Date())}
                  </div>
                </div>
              </div>
            )}

            {/* Suggestion buttons */}
            {showSuggestions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 36 }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(0,188,212,0.4)',
                      borderRadius: 10,
                      color: '#00bcd4',
                      fontSize: 12,
                      padding: '7px 12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => {
                      const b = e.currentTarget as HTMLButtonElement
                      b.style.background = 'rgba(0,188,212,0.1)'
                      b.style.borderColor = 'rgba(0,188,212,0.7)'
                    }}
                    onMouseLeave={e => {
                      const b = e.currentTarget as HTMLButtonElement
                      b.style.background = 'transparent'
                      b.style.borderColor = 'rgba(0,188,212,0.4)'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Message list */}
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: msg.role === 'user' ? 'rgba(255,255,255,0.15)' : 'var(--magenta, #e91e8c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: msg.role === 'user' ? 12 : 13,
                    color: '#fff',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {msg.role === 'user' ? (userName ? userName[0].toUpperCase() : 'T') : '✦'}
                </div>

                <div style={{ maxWidth: 260 }}>
                  <div
                    style={{
                      background: msg.role === 'user'
                        ? 'var(--magenta, #e91e8c)'
                        : 'rgba(255,255,255,0.07)',
                      borderRadius: msg.role === 'user'
                        ? '16px 4px 16px 16px'
                        : '4px 16px 16px 16px',
                      padding: '10px 14px',
                      color: '#e0e0e0',
                      fontSize: 13,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                  <div
                    style={{
                      color: '#555',
                      fontSize: 10,
                      marginTop: 4,
                      textAlign: msg.role === 'user' ? 'right' : 'left',
                      marginLeft: msg.role === 'user' ? 0 : 4,
                      marginRight: msg.role === 'user' ? 4 : 0,
                    }}
                  >
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--magenta, #e91e8c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    color: '#fff',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  ✦
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: '4px 16px 16px 16px',
                    padding: '12px 16px',
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',
                  }}
                >
                  {['tp-dot-1', 'tp-dot-2', 'tp-dot-3'].map(cls => (
                    <span
                      key={cls}
                      className={cls}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: 'var(--magenta, #e91e8c)',
                        display: 'inline-block',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              padding: '12px 14px',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              flexShrink: 0,
              background: '#1a1a2e',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize() }}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              rows={1}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: '#e0e0e0',
                fontSize: 13,
                padding: '10px 14px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: 'auto',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--magenta, #e91e8c)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: input.trim() && !loading ? 'var(--magenta, #e91e8c)' : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: input.trim() && !loading ? '#fff' : '#555',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}
