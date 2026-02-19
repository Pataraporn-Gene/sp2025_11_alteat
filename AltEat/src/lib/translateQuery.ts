export function containsThai(text: string): boolean {
  return /[\u0E00-\u0E7F]/.test(text)
}

export async function translateToEnglish(query: string): Promise<string> {
  if (!containsThai(query)) return query

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=th|en`
    )
    const data = await res.json()

    const translated: string = data?.responseData?.translatedText

    if (translated && translated.toLowerCase() !== query.toLowerCase()) {
      return translated
    }
    return query
  } catch {
    console.warn("Translation failed, using original query:", query)
    return query
  }
}
