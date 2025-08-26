// Validation côté serveur pour la création de ressources
// Ce fichier n'utilise PAS "use client" et peut donc être importé dans les routes API

export type ServerResourceType = 'escrow' | 'non_escrow'
export type ServerFrameworkType = 'ESX' | 'QBCore' | 'Standalone'
export type ServerResourceCategory = 'Police' | 'Civilian' | 'UI' | 'Jobs' | 'Vehicles'

export interface ResourceCreatePayload {
  title: string
  description: string
  price: number
  resource_type: ServerResourceType
  framework?: ServerFrameworkType
  category?: ServerResourceCategory
  escrowInfo?: {
    requires_cfx_id?: boolean
    requires_email?: boolean
    requires_username?: boolean
    delivery_instructions?: string
  }
}

export interface ServerValidationErrors {
  title?: string
  description?: string
  price?: string
  resource_type?: string
  framework?: string
  category?: string
  escrowInfo?: {
    delivery_instructions?: string
  }
}

const TITLE_MIN = 3
const TITLE_MAX = 100
const DESC_MIN = 50
const DESC_MAX = 5000
const PRICE_MIN = 0.01
const PRICE_MAX = 999999.99

export function validateResourcePayload(data: Partial<ResourceCreatePayload>): ServerValidationErrors {
  const errors: ServerValidationErrors = {}

  // Titre
  const title = (data.title ?? '').toString()
  if (!title.trim()) {
    errors.title = 'Le titre est obligatoire'
  } else if (title.trim().length < TITLE_MIN) {
    errors.title = `Le titre doit contenir au moins ${TITLE_MIN} caractères`
  } else if (title.length > TITLE_MAX) {
    errors.title = `Le titre ne peut pas dépasser ${TITLE_MAX} caractères`
  }

  // Description
  const description = (data.description ?? '').toString()
  if (!description.trim()) {
    errors.description = 'La description est obligatoire'
  } else if (description.trim().length < DESC_MIN) {
    errors.description = `La description doit contenir au moins ${DESC_MIN} caractères`
  } else if (description.length > DESC_MAX) {
    errors.description = `La description ne peut pas dépasser ${DESC_MAX} caractères`
  }

  // Prix
  const price = Number(data.price)
  if (Number.isNaN(price)) {
    errors.price = 'Le prix doit être un nombre'
  } else if (price < PRICE_MIN) {
    errors.price = `Le prix minimum est de ${PRICE_MIN}€`
  } else if (price > PRICE_MAX) {
    errors.price = `Le prix maximum est de ${PRICE_MAX}€`
  }

  // Type de ressource
  const allowedTypes: ServerResourceType[] = ['escrow', 'non_escrow']
  if (!data.resource_type || !allowedTypes.includes(data.resource_type)) {
    errors.resource_type = 'Type de ressource invalide'
  }

  // Framework
  if (data.framework) {
    const allowedFrameworks: ServerFrameworkType[] = ['ESX', 'QBCore', 'Standalone']
    if (!allowedFrameworks.includes(data.framework)) {
      errors.framework = 'Framework invalide'
    }
  }

  // Catégorie
  if (data.category) {
    const allowedCategories: ServerResourceCategory[] = ['Police', 'Civilian', 'UI', 'Jobs', 'Vehicles']
    if (!allowedCategories.includes(data.category)) {
      errors.category = 'Catégorie invalide'
    }
  }

  // Escrow
  if (data.resource_type === 'escrow' && data.escrowInfo?.delivery_instructions) {
    if (data.escrowInfo.delivery_instructions.length > 1000) {
      errors.escrowInfo = { delivery_instructions: 'Les instructions de livraison ne peuvent pas dépasser 1000 caractères' }
    }
  }

  return errors
}

export function sanitizeResourcePayload(data: ResourceCreatePayload): ResourceCreatePayload {
  return {
    ...data,
    title: data.title.trim(),
    description: data.description.trim(),
    price: Math.round(Number(data.price) * 100) / 100,
    escrowInfo: data.escrowInfo
      ? {
          ...data.escrowInfo,
          delivery_instructions: data.escrowInfo.delivery_instructions?.trim(),
        }
      : undefined,
  }
}


