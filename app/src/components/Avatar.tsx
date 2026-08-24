export function Avatar({
  name,
  className,
}: {
  name: string | null | undefined
  className?: string
}) {
  const initial = (name?.trim()?.[0] ?? 'A').toUpperCase()
  return (
    <div
      className={
        className ??
        'flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-title-sm text-title-sm text-on-primary-container'
      }
    >
      {initial}
    </div>
  )
}
