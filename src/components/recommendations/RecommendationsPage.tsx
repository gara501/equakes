import './RecommendationsPage.css'
import { BackpackBuilder } from './BackpackBuilder'
import { DecisionSimulator } from './DecisionSimulator'

export function RecommendationsPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="recommendations-page" aria-labelledby="recommendations-title">
      <div className="recommendations-page__intro">
        <div className="recommendations-page__copy">
          <p className="eyebrow">Preparacion operativa</p>
          <h1 id="recommendations-title">Recomendaciones</h1>
          <p className="lede">
            Dos herramientas practicas para pasar de la curiosidad a la
            preparacion real: una mochila calculada segun tu hogar y un
            simulador para entrenar decisiones bajo estres.
          </p>
        </div>

        <button className="scale-back-button recommendations-page__back" onClick={onBack} type="button">
          Volver al mapa
        </button>
      </div>

      <div className="recommendations-page__layout">
        <BackpackBuilder />
        <DecisionSimulator />
      </div>
    </section>
  )
}
