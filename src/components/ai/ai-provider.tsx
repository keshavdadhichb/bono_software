"use client"

import * as React from "react"
import { AiCommandBar } from "./command-bar"

/**
 * AiProvider wraps the AI command bar and makes it globally available
 * within the dashboard layout. It renders the floating button and
 * the chat panel, handling the Ctrl+K keyboard shortcut.
 *
 * Usage: Place <AiProvider /> at the end of the dashboard layout body.
 */
export function AiProvider() {
  return <AiCommandBar />
}
