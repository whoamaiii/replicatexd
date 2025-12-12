export type PromptFlavor = 'openai' | 'midjourney' | 'kling' | 'technical'

export type PromptBundle = {
  id: string
  flavor: PromptFlavor
  title: string
  description: string
  prompt: string
  notes?: string
}


