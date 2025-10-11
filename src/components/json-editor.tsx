'use client'

import { useEffect, useRef } from 'react'
import { createJSONEditor, type JSONEditorPropsOptional } from 'vanilla-jsoneditor'
import { useTheme } from 'next-themes'

type JSONEditorProps = JSONEditorPropsOptional

export function JsonEditor(props: JSONEditorProps) {
  const refContainer = useRef<HTMLDivElement>(null)
  const refEditor = useRef<ReturnType<typeof createJSONEditor> | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    // create editor
    if (refContainer.current) {
      refEditor.current = createJSONEditor({
        target: refContainer.current,
        props: {},
      })
    }

    return () => {
      // destroy editor
      if (refEditor.current) {
        refEditor.current.destroy()
        refEditor.current = null
      }
    }
  }, [])

  useEffect(() => {
    // update props
    if (refEditor.current) {
      refEditor.current.updateProps(props)
    }
  }, [props])

  return (
    <div
      className={`json-editor-container h-full ${theme === 'dark' ? 'jse-theme-dark' : ''}`}
      ref={refContainer}
    ></div>
  )
}
