"use client"

import React, { useCallback, useState } from "react"
import { Upload, X, File, CheckCircle2, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

import { cn } from "@/lib/utils"

export interface HaloDropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onFilesDrop?: (files: File[]) => void
  maxFiles?: number
  accept?: string
  maxSizeMB?: number
}

export function HaloDropzone({
  className,
  onFilesDrop,
  maxFiles = 1,
  accept,
  maxSizeMB = 50,
  ...props
}: HaloDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const validateFiles = (newFiles: File[]) => {
    setError(null)
    if (files.length + newFiles.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} file(s).`)
      return []
    }
    
    const validFiles = []
    for (const file of newFiles) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File ${file.name} exceeds the ${maxSizeMB}MB size limit.`)
        return []
      }
      validFiles.push(file)
    }
    return validFiles
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files)
        const validFiles = validateFiles(droppedFiles)
        
        if (validFiles.length > 0) {
          const updatedFiles = [...files, ...validFiles]
          setFiles(updatedFiles)
          onFilesDrop?.(updatedFiles)
        }
      }
    },
    [files, maxFiles, maxSizeMB, onFilesDrop]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const selectedFiles = Array.from(e.target.files)
        const validFiles = validateFiles(selectedFiles)
        
        if (validFiles.length > 0) {
          const updatedFiles = [...files, ...validFiles]
          setFiles(updatedFiles)
          onFilesDrop?.(updatedFiles)
        }
      }
    },
    [files, maxFiles, maxSizeMB, onFilesDrop]
  )

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove)
    setFiles(updatedFiles)
    onFilesDrop?.(updatedFiles)
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-48 p-6",
          "border-2 border-dashed rounded-xl transition-all duration-300 ease-out",
          "bg-background/40 backdrop-blur-sm overflow-hidden group",
          isDragging
            ? "border-transparent"
            : "border-border hover:border-primary/50",
          files.length >= maxFiles && !isDragging && "opacity-50 cursor-not-allowed"
        )}
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 -z-10"
              style={{
                background: "linear-gradient(135deg, rgba(80,26,150,0.15) 0%, rgba(16,138,194,0.15) 100%)",
              }}
            >
              <div
                className="absolute inset-0 halo-violet-live opacity-50 blur-xl mix-blend-screen"
                style={{
                  background: "linear-gradient(90deg, #501A96, #108AC2, #501A96)",
                  backgroundSize: "200% 100%",
                }}
              />
              <div className="absolute inset-0 border-2 border-primary/50 rounded-xl pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center justify-center space-y-4 text-center pointer-events-none z-10">
          <div
            className={cn(
              "p-4 rounded-full transition-colors duration-300",
              isDragging ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}
          >
            <Upload size={28} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              <span className="text-primary font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              {accept ? `Accepts ${accept}` : "Any file"} (Max {maxSizeMB}MB)
            </p>
          </div>
        </div>

        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileInput}
          accept={accept}
          multiple={maxFiles > 1}
          disabled={files.length >= maxFiles}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="flex items-center gap-2 mt-3 text-sm text-destructive"
          >
            <AlertCircle size={16} />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded bg-primary/10 text-primary shrink-0">
                    <File size={16} />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium truncate text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
