import type { ImageSourcePropType } from 'react-native';

const MCardIcon = require('../assets/payment-icons/bp_payment.webp');
const CreditDebitIcon = require('../assets/payment-icons/c-d_payment.webp');
const CashIcon = require('../assets/payment-icons/c_payment.webp');
const DiningDollarsIcon = require('../assets/payment-icons/did_payment.webp');

export type PaymentMethod = 'MCard' | 'Cash' | 'Credit/Debit' | 'Dining Dollars';

const PAYMENT_INFO_ICONS: Record<PaymentMethod, ImageSourcePropType> = {
  MCard: MCardIcon,
  Cash: CashIcon,
  'Credit/Debit': CreditDebitIcon,
  'Dining Dollars': DiningDollarsIcon,
};

export { PAYMENT_INFO_ICONS };
