/**
 * The toast every copy on the site shows: the copy icon writes its check on the
 * toast's stage. One id, so copying again within a moment updates it instead of
 * stacking another. The toast's code is fetched on the first copy, so no page
 * carries it on arrival (the site's Toaster is lazy for the same reason).
 */
export async function copyToast(title: string, description?: string) {
  const [{ toast }, { CopyIcon }] = await Promise.all([import('@youj/react/components/ui/toast'), import('@youj/icons/components/youj/icons/copy')])
  toast.success(title, { id: 'copied', description, media: <CopyIcon trigger="mount" /> })
}
