interface ColorSwatchProps {
  colorCode: string
  className?: string
}

export function ColorSwatch({ colorCode, className = "w-4 h-4 rounded border border-gray-300" }: ColorSwatchProps) {
  return (
    <div 
      className={className}
      style={{ backgroundColor: colorCode }}
    />
  )
}
