import { useTranslation } from 'react-i18next'
import { Placeholder } from '@/components/Placeholder'

export default function InventoryPage() {
  const { t } = useTranslation()
  return <Placeholder title={t('nav.inventory')} />
}
