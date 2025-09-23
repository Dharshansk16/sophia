"use client"

import { toast as sonnerToast } from "sonner"

type ToastVariant = "default" | "destructive" | "success"

interface ToastProps {
  title?: string
  description?: string
  variant?: ToastVariant
}

function toast({ title, description, variant = "default" }: ToastProps) {
  const message = title || description || ""
  const descriptionText = title && description ? description : undefined

  switch (variant) {
    case "destructive":
      return sonnerToast.error(message, {
        description: descriptionText,
      })
    case "success":
      return sonnerToast.success(message, {
        description: descriptionText,
      })
    default:
      return sonnerToast(message, {
        description: descriptionText,
      })
  }
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  }
}

export { useToast, toast }
