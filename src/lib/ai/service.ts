/**
 * Intelligence Layer - Mock Cloudflare AI Workers
 * In production, these would fetch real endpoints using CLOUDFLARE_AI_TOKEN
 */

export async function analyzeImage(_imageUrl: string) {
  // Simulate AI Processing Delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  return {
    description: "A group of family members gathered in a lush garden, likely during a festive occasion.",
    tags: ["family", "garden", "celebration", "outdoor", "tradition"],
    detected_faces: [
      { id: "f1", box: { x: 100, y: 150, w: 50, h: 50 }, confidence: 0.98, suggestion: "Ramesh Kumar" },
      { id: "f2", box: { x: 300, y: 160, w: 45, h: 45 }, confidence: 0.92, suggestion: "Meena Dewangan" }
    ],
    objects: ["people", "trees", "table", "food"]
  }
}

export async function analyzeStory(_text: string) {
  // Simulate LLM Processing Delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    summary: "A heartfelt account of the family's resilience during the 1975 floods and their community leadership.",
    themes: ["resilience", "leadership", "community", "courage"],
    sentiment: "Positive",
    key_entities: ["Ramesh Kumar", "Raipur", "1975 Monsoon"]
  }
}

export async function generateEmbeddings(_text: string) {
  // Mock vector generation
  return Array.from({ length: 1536 }, () => Math.random())
}
