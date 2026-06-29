import { useCallback, useEffect, useMemo, useState } from 'react'
import './DecisionSimulator.css'
import { QUIZ_DURATION_MS, QUIZ_QUESTIONS } from './recommendationsData'

type QuizStatus = 'answered' | 'playing' | 'results' | 'timeout'

function getScoreLabel(score: number, total: number) {
  if (score === total) {
    return 'Tomas decisiones con criterio y priorizas reducir exposicion antes de actuar.'
  }

  if (score >= Math.ceil(total * 0.67)) {
    return 'Vas bien, pero aun hay escenarios donde una reaccion impulsiva podria jugarte en contra.'
  }

  return 'Necesitas reforzar la toma de decisiones bajo estres. La preparacion previa reduce errores durante un sismo real.'
}

export function DecisionSimulator() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [status, setStatus] = useState<QuizStatus>('playing')
  const [timeLeftMs, setTimeLeftMs] = useState(QUIZ_DURATION_MS)

  const currentQuestion = QUIZ_QUESTIONS[currentIndex]
  const correctOption = useMemo(
    () => currentQuestion.options.find((option) => option.isCorrect) ?? currentQuestion.options[0],
    [currentQuestion],
  )
  const selectedOption = useMemo(
    () =>
      currentQuestion.options.find((option) => option.id === selectedOptionId) ?? null,
    [currentQuestion, selectedOptionId],
  )
  const isLocked = status === 'answered' || status === 'timeout'
  const feedbackCopy =
    status === 'timeout'
      ? correctOption.explanation
      : selectedOption?.explanation ?? correctOption.explanation

  useEffect(() => {
    if (status !== 'playing') {
      return
    }

    const startedAt = performance.now()
    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - startedAt
      const remaining = Math.max(0, QUIZ_DURATION_MS - elapsed)

      setTimeLeftMs(remaining)

      if (remaining <= 0) {
        window.clearInterval(intervalId)
        setStatus('timeout')
      }
    }, 100)

    return () => window.clearInterval(intervalId)
  }, [currentIndex, status])

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (status !== 'playing') {
        return
      }

      const option =
        currentQuestion.options.find((currentOption) => currentOption.id === optionId) ??
        null

      if (!option) {
        return
      }

      setSelectedOptionId(option.id)
      setStatus('answered')

      if (option.isCorrect) {
        setScore((currentScore) => currentScore + 1)
      }
    },
    [currentQuestion, status],
  )

  const handleNext = useCallback(() => {
    if (currentIndex === QUIZ_QUESTIONS.length - 1) {
      setStatus('results')
      return
    }

    setCurrentIndex((index) => index + 1)
    setSelectedOptionId(null)
    setStatus('playing')
    setTimeLeftMs(QUIZ_DURATION_MS)
  }, [currentIndex])

  const handleRestart = useCallback(() => {
    setCurrentIndex(0)
    setScore(0)
    setSelectedOptionId(null)
    setStatus('playing')
    setTimeLeftMs(QUIZ_DURATION_MS)
  }, [])

  return (
    <section className="decision-simulator recommend-tool" aria-labelledby="simulator-title">
      <div className="recommend-tool__header">
        <div>
          <p className="recommend-tool__eyebrow">Componente 2</p>
          <h2 id="simulator-title">Simulador de decisiones rapidas</h2>
        </div>
        <span className="recommend-tool__badge">3 escenarios</span>
      </div>

      <p className="recommend-tool__intro">
        Practica bajo presion. Cada pregunta te obliga a elegir rapido y a
        entender por que una accion intuitiva puede ser la equivocada.
      </p>

      {status === 'results' ? (
        <div className="decision-simulator__results">
          <span>Resultado final</span>
          <strong>
            {score}/{QUIZ_QUESTIONS.length}
          </strong>
          <p>{getScoreLabel(score, QUIZ_QUESTIONS.length)}</p>
          <button onClick={handleRestart} type="button">
            Reiniciar simulador
          </button>
        </div>
      ) : (
        <div className="decision-simulator__body">
          <div className="decision-simulator__meta">
            <div>
              <span>{currentQuestion.context}</span>
              <strong>
                Pregunta {currentIndex + 1} de {QUIZ_QUESTIONS.length}
              </strong>
            </div>
            <div className="decision-simulator__time">
              <strong>{Math.ceil(timeLeftMs / 1000)} s</strong>
            </div>
          </div>

          <div className="decision-simulator__timer" aria-hidden="true">
            <span
              className={`decision-simulator__timerFill ${status === 'playing' ? 'is-running' : 'is-paused'}`}
              key={currentQuestion.id}
              style={{ animationDuration: `${QUIZ_DURATION_MS}ms` }}
            />
          </div>

          <div className="decision-simulator__question">
            <h3>{currentQuestion.prompt}</h3>
          </div>

          <div className="decision-simulator__options" role="list">
            {currentQuestion.options.map((option) => {
              const isSelected = option.id === selectedOptionId
              const showCorrect = isLocked && option.isCorrect
              const showError =
                isLocked && isSelected && !option.isCorrect

              return (
                <button
                  className={`decision-simulator__option ${isSelected ? 'is-selected' : ''} ${showCorrect ? 'is-correct' : ''} ${showError ? 'is-incorrect' : ''}`}
                  disabled={isLocked}
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  type="button"
                >
                  <span>{option.label}</span>
                  <strong>{option.text}</strong>
                </button>
              )
            })}
          </div>

          {isLocked ? (
            <div
              aria-live="polite"
              className={`decision-simulator__feedback ${status === 'timeout' || !selectedOption?.isCorrect ? 'is-negative' : 'is-positive'}`}
            >
              <strong>
                {status === 'timeout'
                  ? 'Se acabo el tiempo'
                  : selectedOption?.isCorrect
                    ? 'Decision correcta'
                    : 'Decision riesgosa'}
              </strong>
              <p>{feedbackCopy}</p>
              <button onClick={handleNext} type="button">
                {currentIndex === QUIZ_QUESTIONS.length - 1
                  ? 'Ver resultado'
                  : 'Siguiente escenario'}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
