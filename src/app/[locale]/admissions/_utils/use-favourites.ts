"use client"

import { useEffect, useState } from "react"

import { favouritesKey, readFavourites } from "./favourites"

export function useFavourites() {
  const [saved, setSaved] = useState<string[]>([])
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      setSaved(readFavourites(localStorage.getItem(favouritesKey)))
    } catch {
      setStorageError(true)
    }
    const sync = (event: StorageEvent) => {
      if (event.key === favouritesKey || event.key === null)
        setSaved(readFavourites(event.newValue))
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])

  function toggle(id: string) {
    let current = saved
    try {
      // Read the latest value to retain changes made in another tab.
      if (!storageError)
        current = readFavourites(localStorage.getItem(favouritesKey))
    } catch {
      /* Keep this visit usable if browser storage is disabled. */
    }
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]
    setSaved(next)
    try {
      localStorage.setItem(favouritesKey, JSON.stringify(next))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }

  return { saved, toggle, storageError }
}
