import React from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-surface-elevated rounded-lg max-w-md w-full max-w-[90vw] p-6 shadow-xl border border-border">
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <p className="mt-2 text-sm text-text-muted">{message}</p>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-primary bg-surface rounded-md hover:bg-surface-elevated transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
