import './RecommendationsPage.css'
import { BackpackBuilder } from './BackpackBuilder'

export function BackpackPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="preparedness-page" aria-labelledby="backpack-page-title">
      <div className="preparedness-page__intro">
        <div className="preparedness-page__copy">
          <p className="eyebrow">Preparacion operativa</p>
          <h1 id="backpack-page-title">Mochila</h1>
          <p className="lede">
            Define tu hogar, calcula cantidades para 72 horas y marca tu avance
            sin perder progreso al cerrar la pagina.
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

      <div className="preparedness-page__layout preparedness-page__layout--single">
        <BackpackBuilder />
      </div>
    </section>
  )
}
