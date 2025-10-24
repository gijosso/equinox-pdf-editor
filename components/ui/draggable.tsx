interface DraggableProps extends React.ComponentProps<"div"> {
  setIsDragging: (isDragging: boolean) => void
}

export const Draggable = ({setIsDragging, onDragEnter, onDragLeave, onDragOver, onDrop, ...props}: DraggableProps) => {
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    onDragEnter?.(e)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    onDragLeave?.(e)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onDragOver?.(e)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    onDrop?.(e)
  }

  return (
    <div
      {...props}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    />
  )
}
