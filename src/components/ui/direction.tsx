"use client"

import { DirectionProvider as DirectionProviderPrimitive } from "@base-ui/react/direction-provider"

function DirectionProvider(props: DirectionProviderPrimitive.Props) {
  return <DirectionProviderPrimitive data-slot="direction" {...props} />
}

export { DirectionProvider }
