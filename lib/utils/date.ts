const defaultFormatDatOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC", // Force UTC to ensure consistency
}

export const formatDate = (dateString: string, options = defaultFormatDatOptions) => {
  return new Intl.DateTimeFormat("en-US", options).format(new Date(dateString))
}
