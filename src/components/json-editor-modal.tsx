'use client'

import { FC, useState, useCallback, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Save, AlertCircle } from 'lucide-react'
import { JsonEditor } from '@/components/json-editor'
import { libraryDataSchema } from '@/lib/schemas/library-schema'
import {
  createAjvValidator,
  type Content,
  type OnChangeStatus,
  type ValidationError,
  Mode,
  type MenuItem,
} from 'vanilla-jsoneditor'
import type { LibraryData } from '@/lib/data'

interface JsonEditorModalProps {
  isOpen: boolean
  onClose: () => void
  initialData: LibraryData
  onSave: (data: LibraryData) => Promise<void>
}

export const JsonEditorModal: FC<JsonEditorModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
}) => {
  const [content, setContent] = useState<Content>({
    json: initialData,
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent({ json: initialData })
      setHasChanges(false)
      setValidationErrors([])
      setSaveError(null)
    }
  }, [isOpen, initialData])

  // Create validator
  const validator = createAjvValidator({ schema: libraryDataSchema })

  // Custom menu renderer to hide mode switcher and other items
  const handleRenderMenu = useCallback((items: MenuItem[]) => {
    return items.filter((item) => {
      // Remove all separators
      if ('type' in item && item.type === 'separator') {
        return false
      }

      // Remove mode labels and unwanted menu items
      if ('text' in item && typeof item.text === 'string') {
        const text = item.text.toLowerCase()
        if (['tree', 'table', 'text', 'transform', 'sort'].includes(text)) {
          return false
        }
      }

      // Remove transform and sort buttons by title
      if ('title' in item && typeof item.title === 'string') {
        const title = item.title.toLowerCase()
        if (title.includes('transform') || title.includes('sort')) {
          return false
        }
      }

      return true
    })
  }, [])

  const handleChange = useCallback(
    (updatedContent: Content, _previousContent: Content, status: OnChangeStatus) => {
      setContent(updatedContent)
      setHasChanges(true)

      // Check for validation errors
      if (status.contentErrors) {
        if ('validationErrors' in status.contentErrors) {
          const errors =
            status.contentErrors.validationErrors?.map((err: ValidationError) => err.message) || []
          setValidationErrors(errors)
        } else {
          setValidationErrors([])
        }
      } else {
        setValidationErrors([])
      }
    },
    []
  )

  const handleSave = async () => {
    if (validationErrors.length > 0) {
      return
    }

    try {
      setIsSaving(true)
      setSaveError(null)

      // Extract JSON from content
      const data = 'json' in content ? content.json : JSON.parse((content as { text: string }).text)

      await onSave(data as LibraryData)
      setHasChanges(false)
      onClose()
    } catch (error) {
      console.error('Failed to save library data:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save library data')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?')
      if (!confirmed) {
        return
      }
    }
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 h-[90vh] w-[90vw] max-w-[1200px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-(--card) shadow-lg overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div>
              <Dialog.Title className="text-2xl font-bold text-(--foreground)">
                Edit Library Data
              </Dialog.Title>
              <Dialog.Description className="text-sm text-(--foreground) opacity-70 mt-1">
                Edit your library data in JSON format. Changes will be validated before saving.
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <JsonEditor
              content={content}
              onChange={handleChange}
              validator={validator}
              mode={Mode.text}
              mainMenuBar={true}
              onRenderMenu={handleRenderMenu}
              statusBar={true}
              readOnly={false}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 bg-(--card)">
            <div className="flex-1">
              {validationErrors.length > 0 && (
                <div className="flex items-start gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Validation errors:</div>
                    <ul className="list-disc list-inside">
                      {validationErrors.slice(0, 3).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {validationErrors.length > 3 && (
                        <li>...and {validationErrors.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
              {saveError && (
                <div className="flex items-start gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>{saveError}</div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md border border-(--border) hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={validationErrors.length > 0 || !hasChanges || isSaving}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
