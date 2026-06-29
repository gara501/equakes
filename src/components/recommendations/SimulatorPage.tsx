import './RecommendationsPage.css'
import { DecisionSimulator } from './DecisionSimulator'

export function SimulatorPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="preparedness-page" aria-labelledby="simulator-page-title">
      <div className="preparedness-page__intro">
        <div className="preparedness-page__copy">
          <p className="eyebrow">Entrenamiento</p>
          <h1 id="simulator-page-title">Simulador</h1>
          <p className="lede">
            Practica decisiones criticas bajo presion con escenarios cortos,
            temporizador y retroalimentacion inmediata.
          </p>
        </div>

        <button
          className="scale-back-button preparedness-page__back"
          onClick={onBack}
          type="button"
        >
          Volver al mapa
        </button>
      </div>

      <div className="preparedness-page__layout preparedness-page__layout--single preparedness-page__layout--narrow">
        <DecisionSimulator />
      </div>
    </section>
  )
}
