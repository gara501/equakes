import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './BackpackBuilder.css'
import { buildEmergencyChecklist, getHouseholdSummary } from './backpackUtils'
import {
  BACKPACK_STORAGE_KEY,
  DEFAULT_PROFILE,
  PET_TYPE_OPTIONS,
} from './recommendationsData'
import type { PreparednessProfile } from './recommendationsData'

interface BackpackBuilderState {
  checkedItems: Record<string, boolean>
  hasGenerated: boolean
  medicationNotes: string
  profile: PreparednessProfile
}

function loadBackpackState(): BackpackBuilderState {
  if (typeof window === 'undefined') {
    return {
      checkedItems: {},
      hasGenerated: false,
      medicationNotes: '',
      profile: DEFAULT_PROFILE,
    }
  }

  try {
    const raw = window.localStorage.getItem(BACKPACK_STORAGE_KEY)

    if (!raw) {
      return {
        checkedItems: {},
        hasGenerated: false,
        medicationNotes: '',
        profile: DEFAULT_PROFILE,
      }
    }

    const parsed = JSON.parse(raw) as Partial<BackpackBuilderState>

    return {
      checkedItems: parsed.checkedItems ?? {},
      hasGenerated: parsed.hasGenerated ?? false,
      medicationNotes: parsed.medicationNotes ?? '',
      profile: {
        ...DEFAULT_PROFILE,
        ...(parsed.profile ?? {}),
      },
    }
  } catch {
    return {
      checkedItems: {},
      hasGenerated: false,
      medicationNotes: '',
      profile: DEFAULT_PROFILE,
    }
  }
}

export function BackpackBuilder() {
  const [state, setState] = useState<BackpackBuilderState>(() => loadBackpackState())

  const checklist = useMemo(
    () => buildEmergencyChecklist(state.profile),
    [state.profile],
  )
  const itemIds = useMemo(
    () => checklist.flatMap((section) => section.items.map((item) => item.id)),
    [checklist],
  )
  const totalItems = itemIds.length
  const checkedCount = itemIds.filter((itemId) => state.checkedItems[itemId]).length
  const progress = totalItems === 0 ? 0 : Math.round((checkedCount / totalItems) * 100)
  const householdSummary = useMemo(
    () => getHouseholdSummary(state.profile),
    [state.profile],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(BACKPACK_STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const updateProfile = useCallback(
    (field: keyof PreparednessProfile, value: number | PreparednessProfile['petType']) => {
      setState((current) => {
        const nextProfile = {
          ...current.profile,
          [field]: value,
        }

        if (field === 'petType' && value === 'ninguno') {
          nextProfile.petCount = 0
        }

        return {
          ...current,
          profile: nextProfile,
        }
      })
    },
    [],
  )

  const handleGenerate = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setState((current) => {
      const validIds = new Set(
        buildEmergencyChecklist(current.profile).flatMap((section) =>
          section.items.map((item) => item.id),
        ),
      )
      const checkedItems = Object.fromEntries(
        Object.entries(current.checkedItems).filter(([itemId]) => validIds.has(itemId)),
      )

      return {
        ...current,
        checkedItems,
        hasGenerated: true,
      }
    })
  }, [])

  const handleToggleItem = useCallback((itemId: string) => {
    setState((current) => ({
      ...current,
      checkedItems: {
        ...current.checkedItems,
        [itemId]: !current.checkedItems[itemId],
      },
    }))
  }, [])

  const handleMedicationNotes = useCallback((value: string) => {
    setState((current) => ({
      ...current,
      medicationNotes: value,
    }))
  }, [])

  const handleReset = useCallback(() => {
    setState({
      checkedItems: {},
      hasGenerated: false,
      medicationNotes: '',
      profile: DEFAULT_PROFILE,
    })
  }, [])

  return (
    <section className="backpack-builder recommend-tool" aria-labelledby="backpack-title">
      <div className="recommend-tool__header">
        <div>
          <p className="recommend-tool__eyebrow">Componente 1</p>
          <h2 id="backpack-title">Mochila de emergencia personalizada</h2>
        </div>
        <span className="recommend-tool__badge">72 horas</span>
      </div>

      <p className="recommend-tool__intro">
        Ajusta tu hogar y genera un checklist realista para preparar una mochila
        que siga siendo util cuando fallen los servicios basicos.
      </p>

      <form className="backpack-builder__form" onSubmit={handleGenerate}>
        <label className="backpack-builder__field">
          <span>Adultos en el hogar</span>
          <input
            min="0"
            onChange={(event) => updateProfile('adults', Number(event.target.value))}
            type="number"
            value={state.profile.adults}
          />
        </label>

        <label className="backpack-builder__field">
          <span>Ninos o bebes</span>
          <input
            min="0"
            onChange={(event) => updateProfile('children', Number(event.target.value))}
            type="number"
            value={state.profile.children}
          />
        </label>

        <label className="backpack-builder__field">
          <span>Adultos mayores</span>
          <input
            min="0"
            onChange={(event) => updateProfile('seniors', Number(event.target.value))}
            type="number"
            value={state.profile.seniors}
          />
        </label>

        <label className="backpack-builder__field">
          <span>Mascotas</span>
          <select
            onChange={(event) =>
              updateProfile('petType', event.target.value as PreparednessProfile['petType'])
            }
            value={state.profile.petType}
          >
            {PET_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="backpack-builder__field">
          <span>Cantidad de mascotas</span>
          <input
            disabled={state.profile.petType === 'ninguno'}
            min="0"
            onChange={(event) => updateProfile('petCount', Number(event.target.value))}
            type="number"
            value={state.profile.petCount}
          />
        </label>

        <div className="backpack-builder__actions">
          <button type="submit">
            {state.hasGenerated ? 'Actualizar mochila' : 'Generar mochila'}
          </button>
          <button type="button" className="backpack-builder__ghost" onClick={handleReset}>
            Reiniciar
          </button>
        </div>
      </form>

      {state.hasGenerated ? (
        <div className="backpack-builder__result">
          <div className="backpack-builder__summary">
            <div>
              <span>Perfil del hogar</span>
              <strong>{householdSummary.join(' / ')}</strong>
            </div>
            <div className="backpack-builder__progress">
              <div className="backpack-builder__progressMeta">
                <span>Progreso del checklist</span>
                <strong>{progress}%</strong>
              </div>
              <div
                aria-hidden="true"
                className="backpack-builder__progressBar"
              >
                <div
                  className="backpack-builder__progressFill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <small>
                {checkedCount} de {totalItems} elementos listos
              </small>
            </div>
          </div>

          <div className="backpack-builder__sections">
            {checklist.map((section) => (
              <article className="backpack-builder__section" key={section.title}>
                <div className="backpack-builder__sectionHeader">
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>

                <div className="backpack-builder__items">
                  {section.items.map((item) => (
                    <label
                      className={`backpack-builder__item ${state.checkedItems[item.id] ? 'is-checked' : ''}`}
                      key={item.id}
                    >
                      <input
                        checked={Boolean(state.checkedItems[item.id])}
                        onChange={() => handleToggleItem(item.id)}
                        type="checkbox"
                      />
                      <div>
                        <div className="backpack-builder__itemHead">
                          <strong>{item.label}</strong>
                          <span>{item.quantity}</span>
                        </div>
                        <p>{item.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {section.title === 'Botiquin' && state.profile.seniors > 0 ? (
                  <label className="backpack-builder__notes">
                    <span>Medicamentos especificos de adultos mayores</span>
                    <textarea
                      onChange={(event) => handleMedicationNotes(event.target.value)}
                      placeholder="Ejemplo: Losartan 50 mg - 7:00 a.m. / Metformina 850 mg - despues del desayuno."
                      rows={4}
                      value={state.medicationNotes}
                    />
                  </label>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="backpack-builder__empty">
          <strong>Calcula primero la mochila</strong>
          <p>
            Cuando envies el formulario veras cantidades recomendadas,
            categorias y una barra de avance persistente.
          </p>
        </div>
      )}
    </section>
  )
}
